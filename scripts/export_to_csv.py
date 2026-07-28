import os
import pandas as pd

# Get the directory where export_to_csv.py is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Build the absolute path to songs.json by going up one level to the project root
JSON_PATH = os.path.abspath(os.path.join(SCRIPT_DIR, '..', 'data', 'songs.json'))
CSV_OUTPUT_PATH = os.path.abspath(os.path.join(SCRIPT_DIR, '..', 'song_output.csv'))

# Load your JSON data safely
with open(JSON_PATH, 'r', encoding='utf-8') as file:
    df = pd.read_json(file)

# Select only the specific columns you need for Excel
selected_columns = ['title', 'artist', 'youtubeId', 'previewStart', 'previewEnd']
filtered_df = df[selected_columns]

# Export to CSV at the root level of your project folder
filtered_df.to_csv(CSV_OUTPUT_PATH, index=False, encoding='utf-8-sig')

print(f"Success! CSV saved to: {CSV_OUTPUT_PATH}")
