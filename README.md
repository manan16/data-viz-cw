# Global Wealth and Adult Literacy Dashboard

An interactive D3.js coursework dashboard exploring the question:

**How does adult literacy vary with wealth across countries over time?**

The dashboard compares adult literacy rates with International Wealth Index scores across countries, years, and world regions. It is designed as a polished academic data visualization submission, with a box plot as the primary landing view and a scatter plot as a secondary exploratory view.

## Features

- Box plot mode for comparing literacy distributions across low-, medium-, and high-wealth country groups
- Scatter plot mode for exploring the country-level wealth-literacy relationship
- Year slider with active progress styling
- World region filter
- Country highlight search in scatter plot mode
- Reset control
- Collapsible chart explanation, expanded by default
- Median literacy summary chips
- Inline legend
- Trend/distribution summary strip
- Key insight cards
- Styled interactive tooltips

## Project Files

- `index.html` - page structure and dashboard layout
- `style.css` - typography, card hierarchy, controls, chart styling, and responsive layout
- `script.js` - D3 data loading, filtering, chart rendering, interactions, tooltips, and insight text
- `final_dataset.csv` - cleaned dataset used by the dashboard
- `clean_data.py` - preprocessing script used to create the final dataset

## How To Run

Because the dashboard loads `final_dataset.csv`, open it through a local static server rather than directly from the file system.

From this folder:

```bash
python3 -m http.server 8001
```

Then open:

```text
http://localhost:8001/
```

If port `8001` is already in use, choose another port:

```bash
python3 -m http.server 8080
```

and open `http://localhost:8080/`.

## Interaction Notes

- Use the **year slider** to move through available years.
- Use **World region** to filter the countries shown.
- Use **View mode** to switch between Box Plot and Scatter Plot.
- In **Box Plot** mode, click a wealth group or median chip to focus that group.
- In **Scatter Plot** mode, search for a country or click a point to highlight it.
- Click legend items in Scatter Plot mode to focus a region.
- Hover over marks to view detailed tooltips.

## Analytical Focus

The visualization investigates whether countries with higher International Wealth Index values also tend to report higher adult literacy rates. The box plot emphasizes distributional differences between wealth groups, while the scatter plot shows individual country positions and the overall trend line.

## Technical Stack

- HTML
- CSS
- JavaScript
- D3.js v7

