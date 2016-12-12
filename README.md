# dem-playground
### Downloading, Processing and Visualization of Digital Elevation Model (DEM) Data

Overview
- [GDAL only process](#gdal-only-process)
- [LineStrings from OpenDEM](#linestrings-from-opendem)
- [Polygons from GeoTIFFs (from CGIAR)](#polygons-from-geotiffs-from-cgiar)
- [Visualization](#visualization)
- [ToDos](#todos)

Before choosing a path to go, you should decide which type of DEM/SRTM data you need. Digital Elevation Models can be provided in two flavours, Polygons and LineStrings. You might be wondering why you need to decide, but its simply a problem of available data. [OpenDEM](http://www.opendem.info/) offers LineStrings in a very good resolution, some of those LineStrings can easily be converted into Polygons, but I ran into a lot of problems when trying to merge LineStrings across tile edges. If you want Polygons you should rather use the USGS/NASA DEM data from the [CGIAR](http://srtm.csi.cgiar.org/) project , which is provided in form of GeoTIFFs, which can easily be polygonized. (If somebody knows an easy way of polygonizing the LineStrings from OpenDEM, please let me know, i have already spend days on figuring this out.)

![OpenDEM & CGIAR](https://raw.githubusercontent.com/sebastian-meier/dem-playground/master/readme_thumbnails/sources.jpg)

I favour Postgres as a middleman, for faster and easier queries (but that is just my opinion). For those who don't want to rely on Postgres i will start with a process that only relies on GDAL.

## GDAL only process

Use one of the processes described below to download either the OpenDEM shapefiles or the CGIAR geotiffs.

If your area contains multiple files i recommend creating a vrt for combined processing, then extracting the area we need and processing it:
```
#GeoTiffs
gdalbuildvrt srtm_cgiar.vrt 1.tif 2.tif ... n.tif


#Shapefiles
gdalbuildvrt srtm_cgiar.vrt 1.shp 2.shp ... n.shp

```




## LineStrings from OpenDEM

### Downloading the data

The [OpenDEM](http://www.opendem.info/) project is collecting and providing elevation data under an open license. (Most of the data is provided by the USGS.)

You can use the web-interface to [download](http://www.opendem.info/download_contours.html) the DEM data as shapefiles. 

Instead of downloading a bunch of zip files manually, you can also use this command to download a list of files stored in a text file

```
wget -i /PATH_TO/Files.txt
```

Files.txt (Example for the area of Germany)
```
http://opendemdata.info/data/srtm_contour/N46E005.zip
http://opendemdata.info/data/srtm_contour/N46E006.zip
http://opendemdata.info/data/srtm_contour/N46E007.zip
http://opendemdata.info/data/srtm_contour/N46E008.zip
http://opendemdata.info/data/srtm_contour/N46E009.zip
http://opendemdata.info/data/srtm_contour/N46E010.zip
http://opendemdata.info/data/srtm_contour/N46E011.zip
http://opendemdata.info/data/srtm_contour/N46E012.zip
http://opendemdata.info/data/srtm_contour/N46E013.zip
http://opendemdata.info/data/srtm_contour/N46E014.zip
http://opendemdata.info/data/srtm_contour/N46E015.zip
...
http://opendemdata.info/data/srtm_contour/N55E015.zip
```

After downloading all files, use this command to unzip all and delete the zip files afterwards
```
find ./ -name \*.zip -exec unzip {} \;
find ./ -name \*.zip -delete
```

### Important DEM into PostgreSQL

Loading all shapefiles into a postgres server
```
for file in */ ; do ogr2ogr -append -f "PostgreSQL" PG:"dbname=DATABASE_NAME" -nln TABLENAME ./${file%/}/${file%/}.shp; done
```

The following step is not mandatory, but i like having Polygons if possible instead of LineStrings. The visualization script also uses Polygons for calculating areas, in order to remove small areas (small is determined relative to zoom level)

Modify the SQL structure
```
#Change the geom column from LineString to Geometry to accept Polygons and LineStrings
ALTER TABLE dem ALTER COLUMN wkb_geometry TYPE geometry(Geometry,4326)

#Where possible convert linestrings to polygons
UPDATE dem SET wkb_geometry = ST_MakePolygon(wkb_geometry) WHERE ST_StartPoint(wkb_geometry) = ST_EndPoint(wkb_geometry)

#To speed things up we add another index for the elevation
CREATE INDEX dem_elevation_idx ON dem USING btree (elevation);
```

![Problem with OpenDEM LineStrings](https://raw.githubusercontent.com/sebastian-meier/dem-playground/master/readme_thumbnails/linestring_problem.jpg)

TODO:Remove offset at the edges of the tiles 

## Polygons from GeoTIFFs (from CGIAR)

### Downloading the data

The CGIAR-CIS (USGS/NASA) project is collecting and providing elevation data under a non-commercial, only free-redistribute license.

You can use the web-interface to [download](http://srtm.csi.cgiar.org) the DEM data as GeoTiffs.

(Jarvis A., H.I. Reuter, A.  Nelson, E. Guevara, 2008, Hole-filled  seamless SRTM data V4, International  Centre for Tropical  Agriculture (CIAT), available  from http://srtm.csi.cgiar.org)

Instead of downloading a bunch of zip files manually, you can use this command to download a list of files stored in a text file

```
wget -i /PATH_TO/Files.txt
```

Files.txt (Example for the area of Germany)
```
ftp://srtm.csi.cgiar.org/SRTM_V41/SRTM_Data_GeoTiff/srtm_38_01.zip
ftp://srtm.csi.cgiar.org/SRTM_V41/SRTM_Data_GeoTiff/srtm_38_02.zip
ftp://srtm.csi.cgiar.org/SRTM_V41/SRTM_Data_GeoTiff/srtm_38_03.zip
ftp://srtm.csi.cgiar.org/SRTM_V41/SRTM_Data_GeoTiff/srtm_39_01.zip
ftp://srtm.csi.cgiar.org/SRTM_V41/SRTM_Data_GeoTiff/srtm_39_02.zip
ftp://srtm.csi.cgiar.org/SRTM_V41/SRTM_Data_GeoTiff/srtm_39_03.zip
```

After downloading all files, use this command to unzip all and delete the zip files afterwards
```
find ./ -name \*.zip -exec unzip {} \;
find ./ -name \*.zip -delete
```

### Importing DEM into PostgreSQL

We first build a virtual combination of all the downloaded GeoTIFFs. This will help merge polygons across the edges of individual GeoTIFFs.

```
gdalbuildvrt srtm_cgiar.vrt srtm_38_01/srtm_38_01.tif srtm_38_02/srtm_38_02.tif srtm_38_03/srtm_38_03.tif srtm_39_01/srtm_39_01.tif srtm_39_02/srtm_39_02.tif srtm_39_03/srtm_39_03.tif
```

Converting GeoTIFFs to shapefile (10m resolution). Depending on the size of the data set, the next steps might take a while.
```
#For Polygons to shapefiles (this will not work for large areas, as there is a limitation to shapefile size)
gdal_polygonize.py srtm_cgiar.vrt -f "ESRI Shapefile" srtm_cgiar.shp

gdal_polygonize.py srtm_cgiar.vrt -f "PostgreSQL" PG:"host=localhost dbname=sebastianmeier user=sebastianmeier port=5432" dem elev

#For LINESTRINGS
gdal_contour -a elev -i 10 srtm_cgiar.vrt srtm_cgiar.shp
```

### Optimizing the data
Using GDAL's polygonize function will result in a lot of small rectangles, due to a lot of different shades of grey in the GeoTiff resulting in a lot of different levels of elevation. Following is an approach that looks at the overall histogram of the elevation and then breaks it down into n-levels thereby creating only n-levels of elevation and dropping the rest of the information.
```
#converting the VRT to GeoTIFF (you can also use VRT but then the GeoTiffs have to be in the same folder than the VRT file, when you don't want to decide what interval to use, you can alternatively use the INTERVAL_IN_METERS parameter to define the number of layers you want, then simply set the COMPUTE_INTERVALS_OPTIONAL paramter to "true")
node split_geotiff.js PATH_TO/srtm_cgiar.vrt INTERVAL_IN_METERS OUTPUT_NAME COMPUTE_INTERVALS_OPTIONAL

#Example
node split_geotiff.js /Users/sebastianmeier/Downloads/DEM_tif/srtm_cgiar_stats.geotiff 100 split_srtm_cgiar
```

If you did not import the data into PostgreSQL directly, now importing the shapefile into Postgres.
```
for file in *.shp; do ogr2ogr -a_srs WGS84  -append -f "PostgreSQL" PG:"dbname=DATABASE_NAME host=localhost" -nln TABLE_NAME ${file}; done
```

To speed things up, add an index on the elevation:
```
CREATE INDEX dem_elevation ON dem (elevation)
```

## Visualization 

### Usage of export.js

If your have created a database containing isolines, using one of the methods above (or any other way, you actually just need a table with isolines that have an elevation column).

You just need to edit the config.json file and add your database credentials and then call the export script.
```
export.js PARAMETERS

#Example
node export.js 12.855709 52.270765 13.870163 52.783299 4326 2000 8 4
```
Use parameters in this sequence:

Bounding Box in Lng/Lat
- xmin   : FLOAT
- ymin   : FLOAT
- xmax   : FLOAT
- ymax   : FLOAT

SRID of the Bounding Box
- srid   : INT(4)

Maximum size in Pixels of the output svg/png
- size   : INT

Number of Isolines to output (will be reduced if less isolines are available), should ideally be dividable by layers
- lines  : INT

Number of layers (individual files) to generate
- layers : INT

TopoJson Simplification (default : 0.000001)
- simplify : float

Name of folder to export to
- folder : STRING or FALSE

Smoothing function for the isolines (one of d3.curveBasis, d3.curveLinear, d3.curveCardinal, d3.curveMonotoneX, d3.curveCatmullRom)
- curve  : STRING

### Output

The script above will generate a geojson and topojson holding the data for all the isolines, in addition it renders a set of SVGs (depending on the number of layers defined in the parameters).

![Output animation](https://raw.githubusercontent.com/sebastian-meier/dem-playground/master/readme_thumbnails/dem_test.gif)

### Contour Map with CartoCSS (e.g. TileMill or Mapbox Studio Classic)

![MapBox using CartoCSS](https://raw.githubusercontent.com/sebastian-meier/dem-playground/master/readme_thumbnails/mapbox.gif)

The GeoJSONs generated with the export script can also be used to create a slippy map with CartoCSS (You could also use the shapefiles directly or the GeoJSONs generated through the process in section #1).

```
Map {
  background-color: #fff;
}

#export{
  line-width: 1;
  line-color: rgba(0,0,0,0.1);
  [elevation > 25]{  line-color: rgba(0,0,0,0.2);}
  [elevation > 50]{  line-color: rgba(0,0,0,0.4);}
  [elevation > 75]{  line-color: rgba(0,0,0,0.6);}
  [elevation > 100]{ line-color: rgba(0,0,0,0.8);}
  [elevation > 125]{ line-color: rgba(0,0,0,1.0);}
}

#export {
  text-fill: rgba(0,0,0,0.1);
  [elevation > 25]{  text-fill: rgba(0,0,0,0.2);}
  [elevation > 50]{  text-fill: rgba(0,0,0,0.5);}
  [elevation > 75]{  text-fill: rgba(0,0,0,0.6);}
  [elevation > 100]{ text-fill: rgba(0,0,0,0.8);}
  [elevation > 125]{ text-fill: rgba(0,0,0,1.0);}

  text-name:[elevation];
  text-face-name:'Open Sans Regular';
  
  text-halo-fill:#fff;
  text-halo-opacity:1;
  text-halo-radius:2;
  
  text-placement:line;
  text-placement-type:dummy;
  
  text-avoid-edges:true;
  
  text-repeat-distance:30;
  text-margin:30;
  
  text-smooth:0.5;
  text-simplify:1;
  
  text-max-char-angle-delta:22.5;
  
  //text-simplify-algorithm:visvalingam-whyatt;
}
```

### Laser-cutting elevation models

Using the SVGs generated through export.js, you can simply create files to be send to a Laser-Cutter. Simply open the SVGs in your favourite Vector editing software, change the size to the real world size you need and export as (Autocad) DXF files.

![Laser-cutter test](https://raw.githubusercontent.com/sebastian-meier/dem-playground/master/readme_thumbnails/lasercutter.jpg)

## ToDos

- Remove the offset errors in the OpenDEM data
- Find a better way to smooth the polygonize output