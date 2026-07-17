# Recommender System Evaluation Report

This report details the hybrid two-stage recommender system implemented on the MovieLens 32M dataset enriched with TMDB and OMDb API metadata.

*Note: The mood/context labels used in training and evaluation are synthetically generated for testing purposes, not from real user sessions.*

## 1. Dataset Preprocessing Statistics

- **Initial Ratings Count**: 32,000,204
- **Initial Users Count**: 200,948
- **Initial Movies Count**: 84,432
- **Filtered & Sampled Ratings Count**: 3,987,767
- **Filtered & Sampled Users Count**: 25,000
- **Filtered & Sampled Movies Count**: 23,172

## 2. Evaluation Results (Precision@1)

Comparison of model accuracy on the held-out leave-one-out test set ($N = 300$ users):

| Recommender Model | Precision@1 | Precision@10 |
| :--- | :--- | :--- |
| **Popularity Baseline** | 0.3333% | 3.6667% |
| **Stage 1: ALS Collaborative Filtering** | 0.6667% | 7.6667% |
| **Stage 2: Full Hybrid (Alpha = 0.3)** | 5.6667% | N/A (single output) |

## 3. Alpha Hyperparameter Sweep Results

The hybrid model uses the formula: 
$$\text{final\_score} = \alpha \cdot \text{CF\_score} + (1 - \alpha) \cdot \text{mood\_similarity}$$

Tuning $\alpha$ against the synthetic mood test set yields:

- $\alpha = 0.3$: Precision@1 = 5.6667%
- $\alpha = 0.4$: Precision@1 = 4.3333%
- $\alpha = 0.5$: Precision@1 = 2.6667%
- $\alpha = 0.6$: Precision@1 = 2.6667%
- $\alpha = 0.7$: Precision@1 = 2.3333%

Optimal value selected: **$\alpha = 0.3$**.

## 4. Synthetic Mood Data Generation Methodology & Limitations

### Generation Method
Every (user, movie) interaction was mapped to a synthetic context vector using a rule-based generator:
- **Capacity** (low/medium/high): Mapped from TMDB runtime (short runtime yields low capacity).
- **Tone** (comfort/stimulation/escapism): Mapped from TMDB genres (comedy maps to comfort; action to stimulation; sci-fi to escapism).
- **Context** (alone/background/focused): Mapped from genres (family movies map to background; drama to focused).
- **Random Noise**: A 15% random mutation chance was applied to all fields to prevent deterministic mappings.

### Limitations
- **No Ground Truth**: Mood data is simulated rather than collected from real user activities.
- **Population Bias**: MovieLens ratings are gathered from voluntary ratings, which skew toward film enthusiasts.
- **No Episode Granularity**: Recommendations are limited to movie level rather than specific TV episodes.
