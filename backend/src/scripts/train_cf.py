import os
import sys
import pandas as pd
import numpy as np
import scipy.sparse as sp
from implicit.als import AlternatingLeastSquares
from tqdm import tqdm
import json

def main():
    print("=== Step 1: Preprocessing & Collaborative Filtering ===")
    
    # Paths
    ratings_path = "ml-32m/ratings.csv"
    movies_path = "ml-32m/movies.csv"
    links_path = "ml-32m/links.csv"
    
    if not (os.path.exists(ratings_path) and os.path.exists(movies_path) and os.path.exists(links_path)):
        print(f"Error: MovieLens dataset files not found in ml-32m/ folder.")
        sys.exit(1)
        
    print("Loading datasets...")
    # Read links and movies
    links = pd.read_csv(links_path)
    movies = pd.read_csv(movies_path)
    
    # Read ratings (this is large, log progress)
    ratings = pd.read_csv(ratings_path)
    
    initial_ratings_count = len(ratings)
    initial_users_count = ratings['userId'].nunique()
    initial_movies_count = ratings['movieId'].nunique()
    
    print(f"Initial Dataset Stats:")
    print(f"  Ratings: {initial_ratings_count:,}")
    print(f"  Users: {initial_users_count:,}")
    print(f"  Movies: {initial_movies_count:,}")
    
    # Filter: Users with >= 20 ratings, Movies with >= 20 ratings
    print("Filtering ratings (users with >= 20 ratings, movies with >= 20 ratings)...")
    user_counts = ratings['userId'].value_counts()
    movie_counts = ratings['movieId'].value_counts()
    
    filtered_ratings = ratings[
        ratings['userId'].isin(user_counts[user_counts >= 20].index) &
        ratings['movieId'].isin(movie_counts[movie_counts >= 20].index)
    ].copy()
    
    # Sample 25,000 users for computational feasibility
    print("Sampling 25,000 users for computational feasibility...")
    np.random.seed(42)
    unique_users = filtered_ratings['userId'].unique()
    sampled_users = np.random.choice(unique_users, size=min(25000, len(unique_users)), replace=False)
    filtered_ratings = filtered_ratings[filtered_ratings['userId'].isin(sampled_users)].copy()
    
    filtered_ratings_count = len(filtered_ratings)
    filtered_users_count = filtered_ratings['userId'].nunique()
    filtered_movies_count = filtered_ratings['movieId'].nunique()
    
    print(f"Filtered & Sampled Dataset Stats:")
    print(f"  Ratings: {filtered_ratings_count:,}")
    print(f"  Users: {filtered_users_count:,}")
    print(f"  Movies: {filtered_movies_count:,}")
    
    # Map to contiguous indices
    print("Mapping to contiguous indices...")
    user_to_idx = {uid: idx for idx, uid in enumerate(filtered_ratings['userId'].unique())}
    movie_to_idx = {mid: idx for idx, mid in enumerate(filtered_ratings['movieId'].unique())}
    
    idx_to_user = {idx: uid for uid, idx in user_to_idx.items()}
    idx_to_movie = {idx: mid for mid, idx in movie_to_idx.items()}
    
    filtered_ratings['user_idx'] = filtered_ratings['userId'].map(user_to_idx)
    filtered_ratings['item_idx'] = filtered_ratings['movieId'].map(movie_to_idx)
    
    # Leave-one-out split: Hold out each user's most recent rating by timestamp
    print("Performing leave-one-out split per user...")
    # Sort by timestamp to find the latest
    filtered_ratings = filtered_ratings.sort_values(by=['user_idx', 'timestamp'])
    
    # Latest rating per user
    test_df = filtered_ratings.groupby('user_idx').tail(1).copy()
    # Everything else is train
    train_df = filtered_ratings.drop(test_df.index).copy()
    
    print(f"Train set size: {len(train_df):,}")
    print(f"Test set size: {len(test_df):,}")
    
    # Build sparse matrix
    num_users = len(user_to_idx)
    num_items = len(movie_to_idx)
    
    print(f"Building sparse user-item matrix ({num_users} users, {num_items} items)...")
    # For implicit feedback, we use rating value as confidence
    user_items = sp.csr_matrix(
        (train_df['rating'].astype(np.float32), (train_df['user_idx'], train_df['item_idx'])),
        shape=(num_users, num_items)
    )
    
    print("Training Alternating Least Squares (ALS) model...")
    model = AlternatingLeastSquares(
        factors=64,
        regularization=0.1,
        iterations=15,
        random_state=42,
        num_threads=0
    )
    # Fit model
    model.fit(user_items)
    print("ALS model training completed.")
    
    # Precompute popularity baseline
    print("Computing popularity baseline...")
    # Popularity is defined by rating count in training set
    popularity_counts = train_df['item_idx'].value_counts()
    popular_item_indices = popularity_counts.index.tolist()
    
    # Evaluate popularity baseline and CF-only on a representative sample of test users to save time
    eval_sample_size = min(300, num_users)
    print(f"Evaluating models on a sample of {eval_sample_size:,} users...")
    
    cf_p1_hits = 0
    cf_p10_hits = 0
    pop_p1_hits = 0
    pop_p10_hits = 0
    
    # We will export candidates for these evaluated users
    candidates_export = {}
    
    # Set of unique movie indices recommended in top 50 across evaluated users
    recommended_item_idx_set = set()
    
    # Keep track of actual test items
    test_dict = test_df.set_index('user_idx')['item_idx'].to_dict()
    
    for u_idx in tqdm(range(eval_sample_size), desc="Evaluating & generating candidates"):
        actual_item_idx = test_dict.get(u_idx)
        if actual_item_idx is None:
            continue
            
        # 1. CF recommendations
        rec_idx, rec_scores = model.recommend(
            u_idx,
            user_items[u_idx],
            N=50,
            filter_already_liked_items=True
        )
        
        # Track recommended items
        for r_id in rec_idx:
            recommended_item_idx_set.add(int(r_id))
            
        # Evaluate CF
        if len(rec_idx) > 0:
            if rec_idx[0] == actual_item_idx:
                cf_p1_hits += 1
            if actual_item_idx in rec_idx[:10]:
                cf_p10_hits += 1
                
        # Store contiguous mapped results for exporting
        user_id_str = str(idx_to_user[u_idx])
        candidates_export[user_id_str] = [
            {"movieId": int(idx_to_movie[r_idx]), "score": float(score)}
            for r_idx, score in zip(rec_idx, rec_scores)
        ]
        
        # 2. Popularity baseline recommendations (filter out items user already liked in training)
        user_liked = set(user_items[u_idx].indices)
        pop_recs = []
        for p_idx in popular_item_indices:
            if p_idx not in user_liked:
                pop_recs.append(p_idx)
                if len(pop_recs) == 10:
                    break
                    
        if len(pop_recs) > 0:
            if pop_recs[0] == actual_item_idx:
                pop_p1_hits += 1
            if actual_item_idx in pop_recs[:10]:
                pop_p10_hits += 1
                
    cf_p1 = cf_p1_hits / eval_sample_size
    cf_p10 = cf_p10_hits / eval_sample_size
    pop_p1 = pop_p1_hits / eval_sample_size
    pop_p10 = pop_p10_hits / eval_sample_size
    
    print(f"Evaluation Results on Test Set (N={eval_sample_size:,}):")
    print(f"  Popularity Baseline: Precision@1 = {pop_p1*100:.4f}%, Precision@10 = {pop_p10*100:.4f}%")
    print(f"  ALS CF-only model:   Precision@1 = {cf_p1*100:.4f}%, Precision@10 = {cf_p10*100:.4f}%")
    
    # Export intermediate results for embeddings generation
    print("Preparing candidate movies metadata mapping...")
    # Find all movies we actually need embeddings/metadata for
    unique_rec_movie_ids = [int(idx_to_movie[idx]) for idx in recommended_item_idx_set]
    # Also add the test set actual movies to ensure they have embeddings/metadata for evaluation
    test_movie_ids = [int(mid) for mid in test_df['movieId'].unique()]
    all_needed_movie_ids = list(set(unique_rec_movie_ids + test_movie_ids))
    
    print(f"Total unique movies needing features/metadata: {len(all_needed_movie_ids):,}")
    
    # Create movieId to TMDB mapping from links.csv
    movie_links = links[links['movieId'].isin(all_needed_movie_ids)].copy()
    movie_links['tmdbId'] = movie_links['tmdbId'].fillna(0).astype(int)
    movie_links_dict = movie_links.set_index('movieId')['tmdbId'].to_dict()
    
    # Create movieId to title and genre mapping
    movie_meta = movies[movies['movieId'].isin(all_needed_movie_ids)].copy()
    movie_meta_dict = movie_meta.set_index('movieId').to_dict(orient='index')
    
    needed_movies_metadata = {}
    for mid in all_needed_movie_ids:
        meta = movie_meta_dict.get(mid, {"title": "Unknown", "genres": "Unknown"})
        tmdb_id = movie_links_dict.get(mid, 0)
        needed_movies_metadata[str(mid)] = {
            "movieId": mid,
            "tmdbId": int(tmdb_id),
            "title": meta["title"],
            "genres": meta["genres"]
        }
        
    # Construct target test set entries for Python hybrid evaluation
    # We only keep test entries of the evaluated users sample
    test_set_export = []
    for u_idx in range(eval_sample_size):
        actual_mid = idx_to_movie[test_dict[u_idx]]
        user_id = idx_to_user[u_idx]
        test_set_export.append({
            "userId": int(user_id),
            "movieId": int(actual_mid)
        })
        
    output_data = {
        "stats": {
            "initial_ratings": initial_ratings_count,
            "initial_users": initial_users_count,
            "initial_movies": initial_movies_count,
            "filtered_ratings": filtered_ratings_count,
            "filtered_users": filtered_users_count,
            "filtered_movies": filtered_movies_count,
            "pop_precision_1": pop_p1,
            "pop_precision_10": pop_p10,
            "cf_precision_1": cf_p1,
            "cf_precision_10": cf_p10,
        },
        "candidates": candidates_export,
        "needed_movies": needed_movies_metadata,
        "test_set": test_set_export
    }
    
    output_dir = "src/data"
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, "cf_candidates.json")
    print(f"Saving CF candidates and metadata to {output_file}...")
    with open(output_file, 'w') as f:
        json.dump(output_data, f)
        
    print("Step 1 successfully completed.")

if __name__ == "__main__":
    main()
