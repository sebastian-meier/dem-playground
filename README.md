# dem-playground
### Downloading, Processing and Visualization of Digital Elevation Model (DEM) Data

Before choosing a path to go, you should decide which type of DEM/SRTM data you need. Digital Elevation Models can be provided in two flavours, Polygons and LineStrings. You might be wondering why you need to decide, but its simply a problem of available data. [OpenDEM](http://www.opendem.info/) offers LineStrings in a very good resolution, some of those LineStrings can easily be converted into Polygons, but I ran into a lot of problems when trying to merge LineStrings across tile edges. If you want Polygons you should rather use the USGS/NASA DEM data from the [CGIAR](http://srtm.csi.cgiar.org/) project , which is provided in form of GeoTIFFs, which can easily be polygonized. (If somebody knows an easy way of polygonizing the LineStrings from OpenDEM, please let me know, i have already spend days on figuring this out.)

![OpenDEM & CGIAR](https://raw.githubusercontent.com/sebastian-meier/dem-playground/master/readme_thumbnails/sources.jpg)

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

The following step is not mandatory, but i like having Polygons if possible instead of LineStrings. The script also uses Polygons for calculating areas, in order to remove small areas (small is determined relative to zoom level)
Modify the SQL structure
```
#Change the geom column from LineString to Geometry to accept Polygons and LineStrings
ALTER TABLE dem ALTER COLUMN wkb_geometry TYPE geometry(Geometry,4326)

#Where possible convert linestrings to polygons
UPDATE dem_shp SET wkb_geometry = ST_MakePolygon(wkb_geometry) WHERE ST_StartPoint(wkb_geometry) = ST_EndPoint(wkb_geometry)

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
#converting the VRT to GeoTIFF (you can also use VRT but then the GeoTiffs have to be in the same folder than the VRT file)
node split_geotiff.js PATH_TO/srtm_cgiar.vrt INTERVAL_IN_METERS OUTPUT_NAME
```

If you did not import the data into PostgreSQL directly, now importing the shapefile into Postgres
```
ogr2ogr -f "PostgreSQL" PG:"dbname=DATABASE_NAME" -nln TABLENAME srtm_cgiar.shp
```

To speed things up, add an index on the elevation:
```
CREATE INDEX dem_elevation ON dem (elevation)
```

## References & Approach
Projects like openDEM provide SRTM data already in shapefile format, those data sets sadly only provide LINESTRINGS, which, even though i put in hours of work, i was not able to stitch back together into proper polygons. Even though the resolution would be a lot better.
I then switched to vectorizing geotiffs, which proved to be a lot easer and faster. This site helped a lot: https://epsg4253.wordpress.com/2013/02/08/building-contour-elevation-lines-with-gdal-and-postgis/
If anybody has a good source on how to polygonize srtm data from openDEM, please give me a heads up.