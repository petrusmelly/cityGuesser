# City Guesser - Geography Guessing Game

This interactive map produces pins based on lat/long coordinates of cities. Players guess the city names and can purchase hints like the first letter of the city name, or zoom levels to help identify the city.
**Live Map:** https://petrusmelly.github.io/cityGuesser/

---

## Purpose

Inspired by one of the days in the 30 day map challenge. The day's challenge was placenames. So, I wanted to create a game where players had to guess cities from sattelite imagery.

---

## Tech Stack

| Component | Usage |
|----------|-------|
| HTML, CSS, JS | Static site, button actions, score tracking, loading/transforming geoJSON |
| Leaflet | Mapping & data visualization |
| GeoJSON | Spatial data handling + data encoding |
| GitHub Pages | Free public hosting |

---

## Data Sources

- [City Coordinates] (https://www.arcgis.com/home/item.html?id=9df5e769bfe8412b8de36a2e618c7672)

### Spatial Data
Congressional District Boundaries
Source: U.S. Census Bureau – TIGER/Line Shapefiles (2022)
Dataset: 118th Congressional Districts
Format: Shapefile (.shp)

### Socioeconomic Data
Median Household Income
Source: U.S. Census Bureau – American Community Survey (ACS) 5-Year Estimates (2022)
Table: B19013 — Median Household Income in the Past 12 Months (in 2022 Inflation-Adjusted Dollars)
Fields used:

B19013_001E: Median Income

---

## About the Creator

This project was created by [Chris Petruccelli](https://github.com/petrusmelly), a former park ranger with a background in geography and public lands who is learning some GIS and programming. Built as a portfolio project to demonstrate skills in:

- Data handling
- Web development and deployment
