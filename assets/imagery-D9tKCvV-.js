const o=new Map;function d(i,e,r){const a=`${i}|${e}|${r}`;return o.has(a)||o.set(a,fetch(`${String(i).replace(/\/$/,"")}/data/${e}/formats?token=${encodeURIComponent(r)}`).then(t=>t.ok?t.json():null).then(t=>(t==null?void 0:t.kind)==="raster"||(t==null?void 0:t.kind)==="vector"?t.kind:"table").catch(()=>"table")),o.get(a)}const p=(i,e)=>`${String(i).replace(/\/$/,"")}/data/${e}/download/geotiff`,f=(i,e,r)=>{const a=p(i,e),t=e.split(".").pop();return{Python:`# An image (raster): download the GeoTIFF, then open it with rasterio
# pip install requests rasterio matplotlib
import io, zipfile, requests, rasterio

TOKEN = "${r}"
url = "${a}"

r = requests.get(url, params={"token": TOKEN}, timeout=600)
r.raise_for_status()
z = zipfile.ZipFile(io.BytesIO(r.content))
tif = next(n for n in sorted(z.namelist()) if n.lower().endswith((".tif", ".tiff")))
z.extract(tif, "geohub_image")

with rasterio.open(f"geohub_image/{tif}") as src:
    print(src.width, "x", src.height, "pixels,", src.count, "bands,", src.dtypes[0], src.crs)
    arr = src.read()          # numpy array: (bands, rows, cols)`,"Jupyter (browser)":`# In the built-in Jupyter (Pyodide): download the GeoTIFF and open it in memory
%pip install -q rasterio
import io, zipfile, rasterio
from pyodide.http import pyfetch

TOKEN = "${r}"
r = await pyfetch("${a}?token=" + TOKEN)
z = zipfile.ZipFile(io.BytesIO(await r.bytes()))
tif = next(n for n in sorted(z.namelist()) if n.lower().endswith((".tif", ".tiff")))
src = rasterio.io.MemoryFile(z.read(tif)).open()
print(src.width, src.height, src.count, src.dtypes[0], src.crs)
arr = src.read()`,curl:`# An image (raster): the GeoTIFF with its metadata and README, as a zip
curl -o ${t}_geotiff.zip "${a}?token=${r}"
unzip ${t}_geotiff.zip -d ${t}`,R:`# An image (raster): download the GeoTIFF, then open it with terra
# install.packages("terra")
library(terra)

zipf <- tempfile(fileext = ".zip")
download.file("${a}?token=${r}", zipf, mode = "wb")
files <- unzip(zipf, exdir = file.path(tempdir(), "${t}"))
r <- rast(files[grepl("\\\\.tiff?$", files, ignore.case = TRUE)][1])
r            # size, bands, resolution and coordinate system
plot(r)`,JavaScript:`// An image (raster): download the GeoTIFF zip and read it with geotiff.js
// npm install jszip geotiff
import JSZip from "jszip"
import { fromArrayBuffer } from "geotiff"

const res = await fetch("${a}?token=${r}")
const zip = await JSZip.loadAsync(await res.arrayBuffer())
const name = Object.keys(zip.files).find(n => /\\.tiff?$/i.test(n))
const tiff = await fromArrayBuffer(await zip.file(name).async("arraybuffer"))
const image = await tiff.getImage()
console.log(image.getWidth(), image.getHeight(), image.getSamplesPerPixel(), "bands")
const bands = await image.readRasters()   // one typed array per band`}},n=(i,e)=>({cell_type:"code",execution_count:null,outputs:[],source:i,metadata:e?{geohub:e}:{}}),s=i=>({cell_type:"markdown",metadata:{},source:i});function l(i,e,r){return n(`# GeoHub connection: this cell is refreshed automatically with your current token
import io, json, zipfile
from pyodide.http import pyfetch

TOKEN = ${JSON.stringify(r)}
IMAGE_URL = ${JSON.stringify(p(i,e))}
MAX_MB = 300          # larger images are better opened on your computer (QGIS, Python)

async def load_image():
    r = await pyfetch(f"{IMAGE_URL}?token={TOKEN}")
    if not r.ok:
        raise RuntimeError(f"HTTP {r.status}: {await r.string()}")
    size = int((r.headers or {}).get("content-length") or 0)
    if size > MAX_MB * 1_000_000:
        raise RuntimeError(f"The image is {size / 1e6:,.0f} MB, too large for the notebook in the browser. "
                           f"Download it and open it in QGIS or Python: {IMAGE_URL}?token=...")
    z = zipfile.ZipFile(io.BytesIO(await r.bytes()))
    tifs = sorted(n for n in z.namelist() if n.lower().endswith((".tif", ".tiff")))
    if not tifs:
        raise RuntimeError("The download has no GeoTIFF.")
    main = next((n for n in tifs if not n.startswith("tiles/")), tifs[0])
    meta = next((json.loads(z.read(n)) for n in z.namelist() if n.endswith("_metadata.json")), {})
    path = "/tmp/" + main.split("/")[-1]
    with open(path, "wb") as f:
        f.write(z.read(main))
    note = f" (tile 1 of {len(tifs)}: the other tiles are in the download)" if main.startswith("tiles/") else ""
    print(f"Downloaded {main}{note}")
    return path, meta`,"connection")}function c(i,e,r,a){return[s(`# ${a}
Source: Rwanda Space Agency GeoHub, \`${e}\`. This dataset is an **image (raster)**.

The cells run by themselves when this notebook opens: the image's size, bands and coordinate system, a picture of it, and statistics for each band. Run a cell again with **Shift + Enter**. Your notebook is saved in this browser.`),l(i,e,r),n("%pip install -q rasterio matplotlib"),n(`# The image, downloaded with your token
import rasterio
path, meta = await load_image()
src = rasterio.open(path)
print(meta.get("title") or ${JSON.stringify(a)})
print(f"Size:        {src.width:,} x {src.height:,} pixels")
print(f"Bands:       {src.count}  ({', '.join(d or f'band {i + 1}' for i, d in enumerate(src.descriptions))})")
print(f"Data type:   {src.dtypes[0]}")
print(f"Coordinates: {src.crs}")
print(f"Pixel size:  {src.res[0]:g} x {src.res[1]:g}")
print(f"Bounds:      {tuple(round(v, 6) for v in src.bounds)}")
print(f"No data:     {src.nodata}")`),n(`# A picture of the image: true colour when it has red, green and blue bands, otherwise band 1
import numpy as np
import matplotlib.pyplot as plt

step = max(1, max(src.width, src.height) // 1500)          # keep the picture light
shape = (max(1, src.height // step), max(1, src.width // step))
names = [(d or "").lower() for d in src.descriptions]

def band_of(*keys):
    for k in keys:
        for i, n in enumerate(names):
            if n == k or n.startswith(k):
                return i + 1

def stretch(b):
    b = b.astype("float64")
    ok = np.isfinite(b) if src.nodata is None else np.isfinite(b) & (b != src.nodata)
    if not ok.any():
        return np.zeros_like(b)
    lo, hi = np.percentile(b[ok], (2, 98))
    out = np.clip((b - lo) / ((hi - lo) or 1), 0, 1)
    out[~ok] = np.nan
    return out

rgb = [band_of("red", "b04", "b4"), band_of("green", "b03", "b3"), band_of("blue", "b02", "b2")]
if None in rgb and src.count in (3, 4):
    rgb = [1, 2, 3]
fig, ax = plt.subplots(figsize=(9, 9))
if None not in rgb:
    pic = np.dstack([stretch(src.read(i, out_shape=shape)) for i in rgb])
    ax.imshow(np.nan_to_num(pic))
    ax.set_title(f"True colour (bands {rgb[0]}, {rgb[1]}, {rgb[2]})")
else:
    im = ax.imshow(stretch(src.read(1, out_shape=shape)), cmap="viridis")
    fig.colorbar(im, ax=ax, shrink=0.7, label="band 1 (2-98 % stretch)")
    ax.set_title("Band 1")
ax.axis("off")
plt.show()`),n(`# Statistics for each band
import pandas as pd
rows = []
for i in range(1, src.count + 1):
    b = src.read(i, masked=True)
    valid = b.count()
    rows.append({"band": i, "name": src.descriptions[i - 1] or f"band {i}",
                 "min": float(b.min()) if valid else None, "max": float(b.max()) if valid else None,
                 "mean": float(b.mean()) if valid else None, "no-data cells": int(np.ma.count_masked(b))})
pd.DataFrame(rows)`),s("## Your analysis\n`arr` below is the whole image as a numpy array: (bands, rows, cols). Install extra libraries with `%pip install scikit-image`."),n(`arr = src.read()
print(arr.shape, arr.dtype)

# Example: NDVI = (NIR - Red) / (NIR + Red). Set the band numbers of this image (1 = first band).
# red, nir = arr[4 - 1].astype("float32"), arr[8 - 1].astype("float32")
# ndvi = (nir - red) / (nir + red + 1e-9)
# plt.imshow(ndvi, cmap="RdYlGn", vmin=-1, vmax=1); plt.colorbar(label="NDVI"); plt.show()`)]}export{p as a,l as b,c,d,f as i};
