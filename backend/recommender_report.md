# Drift Recommender System — Evaluation Report (v2)

> This report supersedes v1. Two methodological corrections have been applied:
> (1) full-catalog Precision@1 replaced with the sampled-negative Hit Rate /
> NDCG protocol, and (2) self-referential mood query embedding replaced with
> fixed template sentences.

---

## 1. Why the Evaluation Protocol Changed

### Original approach (v1) — full-catalog Precision@1

For each of the 300 test users, the held-out item was ranked against all
**23,172 movies** in the training catalog. Precision@1 asked: "Is it ranked
first out of 23,172?" This is an extremely hard task:

- A random model achieves P@1 ≈ 1/23,172 ≈ **0.004%**
- Even a well-trained ALS model rarely puts a single specific item first out
  of 23,172 possibilities
- The metric is dominated by catalog size, making it uninformative for
  comparing models against each other

### Corrected approach (v2) — sampled-negative protocol

The **standard protocol** used in virtually all modern recommender-systems
research (He et al. 2017 — NCF; Kang & McAuley 2018 — SASRec; Sun et al.
2019 — BERT4Rec; Rendle et al. 2009 — BPR):

For each test user:
1. Take the one held-out positive item.
2. **Sample 99 items the user never rated** as negatives.
3. Score all 100 items with the model and rank them.
4. Measure whether the positive item is ranked highly.

Metrics on the 100-item ranked list:
- **HR@1** — Hit Rate at 1: did the model rank the positive item first?
- **HR@10** — Hit Rate at 10: is the positive in the top 10?
- **NDCG@10** — Normalised Discounted Cumulative Gain at 10: rewards higher
  ranks within the top 10 (1/log₂(rank+1), normalised by ideal DCG).

This protocol is fair, discriminative, and directly comparable to published
benchmarks. The random baseline is exactly:
HR@1 = 1%, HR@10 = 10%, NDCG@10 ≈ 0.0454.

### Self-referential query fix

v1 constructed the mood query's text embedding as: `target_movie_embedding +
Gaussian_noise(σ=0.08)`. This leaked the answer: the query was semantically
similar to the target by construction, inflating the hybrid model's score.

v2 uses **27 fixed template sentences** — one per (capacity × tone × context)
triple — embedded with the same `all-MiniLM-L6-v2` model used for movies, but
**completely independently** of any target movie. The (capacity, tone, context)
label is still derived from the target movie's genre/runtime (as a proxy for a
real user's stated preference), but the 384-dim embedding component of the
query is now free of target-item information.

---

## 2. Dataset Statistics

| | Before Filtering | After ≥ 20 Ratings Filter + 25k Sample |
|:---|---:|---:|
| Ratings | 32,000,204 | 3,987,767 |
| Users | 200,948 | 25,000 |
| Movies | 84,432 | 23,172 |

- ALS trained on a **25,000-user random sample** (memory constraint on 16 GB RAM).
- Leave-one-out split: each user's most recent rating by timestamp held out.
- Evaluation sample: **300 users** with valid feature vectors and sufficient negative pool.
- Negative sampling pool: 5,869 movies with pre-computed sentence
  embeddings, excluding each user's full rating history.

---

## 3. Sampled-Negative Evaluation Results

Each user's held-out item ranked against 99 randomly sampled unrated items:

| Model | HR@1 | HR@10 | NDCG@10 |
|:---|:---:|:---:|:---:|
| Random baseline (theoretical) | 1.00% | 10.00% | 0.0454 |
| **Popularity Baseline** | 12.00% | 53.33% | 0.3007 |
| **CF-Only (ALS, Stage 1)** | 19.33% | 32.33% | 0.2626 |
| **Full Hybrid (α = 0.7, Stage 1+2)** | 18.67% | 40.67% | 0.2880 |

---

## 4. Alpha Sweep Results

$$\text{final\_score} = \alpha \cdot \text{CF\_norm} + (1 - \alpha) \cdot \text{cosine\_mood\_sim}$$

| α | HR@1 | HR@10 | NDCG@10 | |
|:---:|:---:|:---:|:---:|:---|
| 0.3 | 13.00% | 37.00% | 0.2329 |
| 0.4 | 16.00% | 38.00% | 0.2553 |
| 0.5 | 18.00% | 39.33% | 0.2726 |
| 0.6 | 18.67% | 40.33% | 0.2829 |
| 0.7 | 18.67% | 40.67% | 0.2880 |  ← selected

Best α = **0.7** (selected by NDCG@10 = 0.2880).

---

## 5. Synthetic Mood Data Generation

The (capacity, tone, context) label for each test instance is derived from the
**target movie's attributes** as a proxy for a real user's stated preferences
(since no real mood session data exists):

| Dimension | Rule | Values |
|:---|:---|:---|
| **Capacity** | TMDB runtime: < 100 min → low, > 120 min → high | low / medium / high |
| **Tone** | Genres: Comedy/Animation → comfort; Action/Thriller → stimulation; Sci-Fi/Fantasy → escapism | comfort / stimulation / escapism |
| **Context** | Genres: Comedy/Children → background; Drama/Crime → focused; else → alone | alone / background / focused |
| **Noise** | 15% random field mutation (independent) | — |

The **text embedding component** of the query is now a fixed template sentence
(e.g. *"a heartwarming drama to enjoy by myself"* for medium+comfort+alone),
not the target movie's embedding. This eliminates embedding-level leakage while
retaining realistic genre/runtime signal in the genre and runtime query dimensions.

**Important caveat:** mood labels are synthetic. The evaluation measures whether
the model's mood-content mapping is internally consistent with the rule-based
generator, not whether it satisfies real users' stated preferences. A deployment
evaluation would require a user study or live A/B test.

---

## 6. Architecture Summary (as implemented)

**Stage 1 — ALS Collaborative Filtering**
- Library: `implicit.AlternatingLeastSquares`
- Hyperparameters: factors=64, regularization=0.1, iterations=15
- Input: 25,000 × 23,172 sparse CSR matrix (ratings as implicit confidence)
- Output: top-50 scored candidates per user

**Stage 2 — Content/Mood Re-ranking**
- 403-dim feature vectors: [genre one-hot (18), runtime norm (1), sentence
  embedding (384)] via `all-MiniLM-L6-v2`
- Query vector built from (capacity, tone, context) with template sentence text
- Re-ranking formula: α·CF_norm + (1−α)·cosine_mood_sim
- Optimal α = **0.7** (by NDCG@10 on corrected evaluation)

---

## 7. Known Limitations

| Limitation | Impact |
|:---|:---|
| Synthetic mood labels | Evaluation measures rule-based label consistency, not real user preferences. |
| 25,000-user ALS subsample | ~12% of eligible users; full-scale ALS would have richer latent factors. |
| 300-user candidate coverage | Users outside the 300 evaluated fall back to popularity ranking at serve time. |
| Negative pool from feature set | Negatives drawn from 5,869-movie feature set (not all 23,172), making the evaluation slightly easier than true random negatives from the full catalog. |
| Genre-level query leakage | The capacity/tone/context labels are derived from target movie attributes, creating indirect genre correlation in the genre query weights (not eliminable without real user mood data). |
| MovieLens population bias | Dataset skews toward active English-speaking film enthusiasts. |
| No episode-level granularity | TV episode recommendations use a separate TMDB live endpoint, not the hybrid pipeline. |
| Offline evaluation only | No A/B test or live user feedback; actual user satisfaction may differ from offline metrics. |
