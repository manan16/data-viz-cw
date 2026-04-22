import pandas as pd
import numpy as np
import re

# =========================================================
# FILE PATHS
# =========================================================
education_path = "world-education-data.csv"
wealth_path = "GDL-Mean-International-Wealth-Index-(IWI)-score-of-region-data.csv"
output_path = "final_dataset.csv"

# =========================================================
# LOAD DATA
# =========================================================
edu = pd.read_csv(education_path)
wealth = pd.read_csv(wealth_path)

print("Education columns:")
print(list(edu.columns))
print("\nWealth columns:")
print(list(wealth.columns))


# =========================================================
# HELPERS
# =========================================================
def normalize_text(x):
    if pd.isna(x):
        return np.nan
    x = str(x).strip()
    x = re.sub(r"\s+", " ", x)
    return x

def to_numeric_clean(series):
    return (
        series.astype(str)
        .str.replace("%", "", regex=False)
        .str.replace(",", "", regex=False)
        .str.strip()
        .replace({
            "": np.nan,
            "nan": np.nan,
            "NaN": np.nan,
            "NULL": np.nan,
            "null": np.nan,
            "..": np.nan,
            "N/A": np.nan,
            "n/a": np.nan,
            "-": np.nan
        })
        .pipe(pd.to_numeric, errors="coerce")
    )

# =========================================================
# CLEAN EDUCATION DATA
# =========================================================
edu = edu[["country", "year", "lit_rate_adult_pct"]].copy()

edu = edu.rename(columns={
    "country": "country",
    "year": "year",
    "lit_rate_adult_pct": "adult_literacy_rate"
})

edu["country"] = edu["country"].apply(normalize_text)
edu["year"] = to_numeric_clean(edu["year"]).astype("Int64")
edu["adult_literacy_rate"] = to_numeric_clean(edu["adult_literacy_rate"])

# Keep only valid literacy values
edu = edu.dropna(subset=["country", "year", "adult_literacy_rate"])
edu = edu[
    (edu["adult_literacy_rate"] >= 0) &
    (edu["adult_literacy_rate"] <= 100)
    ]

print("\nEducation preview:")
print(edu.head())


# =========================================================
# CLEAN WEALTH DATA
# =========================================================
# Keep identifier columns + all year columns
year_cols = [str(y) for y in range(1992, 2024)]

wealth = wealth[["Country", "Region"] + year_cols].copy()

wealth["Country"] = wealth["Country"].apply(normalize_text)
wealth["Region"] = wealth["Region"].apply(normalize_text)

# Convert from wide to long
wealth_long = wealth.melt(
    id_vars=["Country", "Region"],
    value_vars=year_cols,
    var_name="year",
    value_name="wealth_iwi"
)

wealth_long = wealth_long.rename(columns={
    "Country": "country",
    "Region": "region"
})

wealth_long["year"] = to_numeric_clean(wealth_long["year"]).astype("Int64")
wealth_long["wealth_iwi"] = to_numeric_clean(wealth_long["wealth_iwi"])

# Keep only valid IWI values
wealth_long = wealth_long.dropna(subset=["country", "year", "wealth_iwi"])
wealth_long = wealth_long[
    (wealth_long["wealth_iwi"] >= 0) &
    (wealth_long["wealth_iwi"] <= 100)
    ]

print("\nWealth long preview:")
print(wealth_long.head())


# =========================================================
# FIX COMMON COUNTRY NAME MISMATCHES
# =========================================================
country_replacements = {
    "United States": "United States of America",
    "USA": "United States of America",
    "U.S.A.": "United States of America",
    "UK": "United Kingdom",
    "Russian Federation": "Russia",
    "Viet Nam": "Vietnam",
    "Iran (Islamic Republic of)": "Iran",
    "Republic of Korea": "South Korea",
    "Korea, Rep.": "South Korea",
    "Korea, Dem. People's Rep.": "North Korea",
    "Egypt, Arab Rep.": "Egypt",
    "Gambia, The": "Gambia",
    "Bahamas, The": "Bahamas",
    "Congo, Dem. Rep.": "Democratic Republic of the Congo",
    "Congo, Rep.": "Republic of the Congo",
    "Czechia": "Czech Republic",
    "Kyrgyz Republic": "Kyrgyzstan",
    "Slovak Republic": "Slovakia",
    "Syrian Arab Republic": "Syria",
    "Yemen, Rep.": "Yemen",
    "Lao PDR": "Laos",
    "Türkiye": "Turkey"
}

edu["country"] = edu["country"].replace(country_replacements)
wealth_long["country"] = wealth_long["country"].replace(country_replacements)


# =========================================================
# MERGE ON COUNTRY + YEAR
# =========================================================
final_df = pd.merge(
    edu,
    wealth_long,
    on=["country", "year"],
    how="inner"
)

# Drop rows where region is missing
final_df["region"] = final_df["region"].fillna("Unknown")

# Final column selection
final_df = final_df[[
    "country",
    "region",
    "year",
    "wealth_iwi",
    "adult_literacy_rate"
]].copy()

# Sort nicely
final_df = final_df.sort_values(["year", "wealth_iwi", "country"]).reset_index(drop=True)

# =========================================================
# SAVE
# =========================================================
final_df.to_csv(output_path, index=False)

print(f"\nSaved cleaned dataset to: {output_path}")
print(f"Rows: {len(final_df)}")
print("\nFinal preview:")
print(final_df.head(20))
print("\nYears in final dataset:")
print(final_df["year"].min(), "to", final_df["year"].max())
print("\nNumber of unique countries:")
print(final_df["country"].nunique())