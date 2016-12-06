# dem-playground
### Downloading, Processing and Visualization of Digital Elevation Model (DEM) Data

Before choosing a path to go, you should decide which type of DEM/SRTM data you need. Digital Elevation Models can be provided in two flavours, Polygons and LineStrings. You might be wondering why you need to decide, but its simply a problem of available data. [OpenDEM](http://www.opendem.info/) offers LineStrings in a very good resolution, some of those LineStrings can easily be converted into Polygons, but I ran into a lot of problems when trying to merge LineStrings across tile edges. If you want Polygons you should rather use the USGS/NASA DEM data from the [CGIAR](http://srtm.csi.cgiar.org/) project , which is provided in form of GeoTIFFs, which can easily be polygonized. (If somebody knows an easy way of polygonizing the LineStrings from OpenDEM, please let me know, i have already spend days on figuring this out.)

![OpenDEM & CGIAR](https://raw.githubusercontent.com/sebastian-meier/dem-playground/master/readme_thumbnails/sources.jpg)

## LineStrings

### Downloading the data

The OpenDEM project is collecting and providing elevation data under an open license. (Most of the data is provided by the USGS.)
You can use the web-interface to download the DEM data as shapefiles: http://www.opendem.info/download_contours.html 

Instead of downloading a bunch of zip files manually simply use this command to download a list of files stored in a text file

```
wget -i /PATH_TO/Files.txt
```

Files.txt (Example for the area of the Netherlands)
```
http://opendemdata.info/data/srtm_contour/N51E003.zip
http://opendemdata.info/data/srtm_contour/N51E004.zip
http://opendemdata.info/data/srtm_contour/N51E005.zip
http://opendemdata.info/data/srtm_contour/N51E006.zip
http://opendemdata.info/data/srtm_contour/N52E004.zip
http://opendemdata.info/data/srtm_contour/N52E005.zip
http://opendemdata.info/data/srtm_contour/N52E006.zip
http://opendemdata.info/data/srtm_contour/N53E004.zip
http://opendemdata.info/data/srtm_contour/N53E005.zip
http://opendemdata.info/data/srtm_contour/N53E006.zip
```

After downloading all files, use this command to unzip all and delete the zip files afterwards
```
find ./ -name \*.zip -exec unzip {} \;
find ./ -name \*.zip -delete
```

### Option #1 - Important DEM into PostgreSQL

Loading all shapefiles into a postgres server
```
for file in */ ; do ogr2ogr -append -f "PostgreSQL" PG:"dbname=DATABASE_NAME" -nln TABLENAME ./${file%/}/${file%/}.shp; done
```

Modify SQL structure
```
//Change the geom column from linestring to geometry to accept polygons and linestrings
ALTER TABLE dem ALTER COLUMN wkb_geometry TYPE geometry(Geometry,4326)
//Where possible convert linestrings to polygons for area calculations to remove small bits
UPDATE dem_shp SET wkb_geometry = ST_MakePolygon(wkb_geometry) WHERE ST_StartPoint(wkb_geometry) = ST_EndPoint(wkb_geometry)

TODO:Remove offset at the edges of the tiles 

ALTER TABLE dem ADD COLUMN state integer DEFAULT 1
ALTER TABLE dem ADD COLUMN start_point geometry(Point,4326)
ALTER TABLE dem ADD COLUMN end_point geometry(Point,4326)

CREATE INDEX dem_elevation_idx ON dem USING btree (elevation);
CREATE INDEX dem_state_idx ON dem USING btree (state);
CREATE INDEX dem_start_point_idx ON dem USING gist (start_point);
CREATE INDEX dem_end_point_idx ON dem USING gist (end_point);
CREATE INDEX dem_start_n_point_idx ON dem USING gist (start_n_point);
CREATE INDEX dem_end_n_point_idx ON dem USING gist (end_n_point);
```

The DEM data is provided in multiple rectangles. In order to optimize the data we join elements with the same height that touch each other.
```

UPDATE dem SET wkb_geometry = ST_MakeValid(wkb_geometry)
DELETE FROM dem WHERE ST_IsValid(wkb_geometry) IS NULL OR NOT ST_IsValid(wkb_geometry) OR ST_NumPoints(wkb_geometry) <3

UPDATE dem SET end_point = ST_EndPoint(wkb_geometry), start_point = ST_StartPoint(wkb_geometry), start_n_point = ST_PointN(wkb_geometry, 2), end_n_point = ST_PointN(wkb_geometry, ST_NumPoints(wkb_geometry)-1)

#Add column for classifying records
ALTER TABLE dem ADD COLUMN geom_type integer DEFAULT 1
CREATE INDEX dem_geomtype_idx ON dem USING btree (geom_type);
#Classify geometries where first and last point are the same (closed path)
UPDATE dem SET geom_type = 1 WHERE ST_StartPoint(wkb_geometry) = ST_EndPoint(wkb_geometry)

#Get the extent, so we can figure out the polygons that touch the edges
SELECT ST_Extent(wkb_geometry) FROM dem

4.99958350280378 -> 15.0004168361371
44.9995839386627 -> 59.9995839386627

5.40291683613712 59.9995839386627,
5.40291683613712 59.9991672719961,
5.40333350280378 59.999048224377,
5.40388905835934 59.9991672719961,
5.40388905835934 59.9995839386627

UPDATE dem SET geom_type = 2, wkb_geometry = ST_AddPoint(wkb_geometry, ST_StartPoint(wkb_geometry)) WHERE (
(CAST(ST_X(ST_StartPoint(wkb_geometry)) AS NUMERIC) = 4.99958350280378 AND CAST(ST_X(ST_EndPoint(wkb_geometry)) AS NUMERIC) = 4.99958350280378) OR 
(CAST(ST_X(ST_StartPoint(wkb_geometry)) AS NUMERIC) = 15.0004168361371 AND CAST(ST_X(ST_EndPoint(wkb_geometry)) AS NUMERIC) = 15.0004168361371) OR 
(CAST(ST_Y(ST_StartPoint(wkb_geometry)) AS NUMERIC) = 44.9995839386627 AND CAST(ST_Y(ST_EndPoint(wkb_geometry)) AS NUMERIC) = 44.9995839386627) OR 
(CAST(ST_Y(ST_StartPoint(wkb_geometry)) AS NUMERIC) = 59.9995839386627 AND CAST(ST_Y(ST_EndPoint(wkb_geometry)) AS NUMERIC) = 59.9995839386627))

CREATE INDEX dem_state_idx ON dem USING btree (state);
CREATE INDEX dem_start_point_idx ON dem USING gist (start_point);
CREATE INDEX dem_end_point_idx ON dem USING gist (end_point);
CREATE INDEX dem_start_n_point_idx ON dem USING gist (start_n_point);
CREATE INDEX dem_end_n_point_idx ON dem USING gist (end_n_point);
```

The DEM data is provided in multiple rectangles. In order to optimize the data we join elements with the same height that touch each other.
```

UPDATE dem SET wkb_geometry = ST_MakeValid(wkb_geometry)
DELETE FROM dem WHERE ST_IsValid(wkb_geometry) IS NULL OR NOT ST_IsValid(wkb_geometry) OR ST_NumPoints(wkb_geometry) <3

UPDATE dem SET end_point = ST_EndPoint(wkb_geometry), start_point = ST_StartPoint(wkb_geometry), start_n_point = ST_PointN(wkb_geometry, 2), end_n_point = ST_PointN(wkb_geometry, ST_NumPoints(wkb_geometry)-1)


```

## Polygons from GeoTIFFs

### Downloading the data

The CGIAR-CIS project is collecting and providing elevation data under a non-commercial, only free-redristribute license. (Most of the data is provided by the USGS/NASA SRTM data set.)
You can use the web-interface to download the DEM data as GeoTiffs: http://srtm.csi.cgiar.org
(Jarvis A., H.I. Reuter, A.  Nelson, E. Guevara, 2008, Hole-filled  seamless SRTM data V4, International  Centre for Tropical  Agriculture (CIAT), available  from http://srtm.csi.cgiar.org)

Instead of downloading a bunch of zip files manually simply use this command to download a list of files stored in a text file

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

### Option #1 - Importing DEM into PostgreSQL

We first build a virtual combination of all the downloaded geotiffs. This will help merge polygons across the edges of individual geotiffs.

```
#data vrt
gdalbuildvrt srtm_cgiar.vrt srtm_38_01/srtm_38_01.tif srtm_38_02/srtm_38_02.tif srtm_38_03/srtm_38_03.tif srtm_39_01/srtm_39_01.tif srtm_39_02/srtm_39_02.tif srtm_39_03/srtm_39_03.tif
```

Converting geotiffs to shapefile (10m resolution). Depending on the size of the data set, the next steps might take a while.
```
#For Polygons
gdal_polygonize.py srtm_cgiar.vrt -f "ESRI Shapefile" srtm_cgiar.shp

gdal_polygonize.py srtm_cgiar.vrt -f "PostgreSQL" PG:"host=localhost dbname=sebastianmeier user=sebastianmeier port=5432" dem elev

#For LINESTRINGS
gdal_contour -a elev -i 10 srtm_cgiar.vrt srtm_cgiar.shp
```

Now importing the shape file into Postgres 
```
ogr2ogr -f "PostgreSQL" PG:"dbname=DATABASE_NAME" -nln TABLENAME srtm_cgiar.shp
```

### Optimizing the data
Using GDAL's polygonize function will result in a lot of small rectangles, only a few will be merged, most of them are disconnected, we will combine all those at same elevation using the ST_Union function, depending on the size of your data set, this will takes ages (really).
```
# Combining the 
CREATE TABLE dem_optimized (
    id integer NOT NULL,
    geom geometry(Geometry,4326),
    elevation integer
);
CREATE SEQUENCE dem_optimized_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE ONLY dem_optimized ALTER COLUMN id SET DEFAULT nextval('dem_optimized_id_seq'::regclass);
ALTER TABLE ONLY dem_optimized
    ADD CONSTRAINT dem_optimized_pkey PRIMARY KEY (id);

CREATE INDEX dem_optimized_elevation ON dem_optimized (elevation)
CREATE INDEX dem_optimized_geom ON dem_optimized USING gist (geom) 
INSERT INTO dem_optimized (geom, elevation) SELECT ST_Union(ST_MakeValid(wkb_geometry)), elevation FROM dem GROUP BY elevation

```

## References & Approach
Projects like openDEM provide SRTM data already in shapefile format, those data sets sadly only provide LINESTRINGS, which, even though i put in hours of work, i was not able to stitch back together into proper polygons. Even though the resolution would be a lot better.
I then switched to vectorizing geotiffs, which proved to be a lot easer and faster. This site helped a lot: https://epsg4253.wordpress.com/2013/02/08/building-contour-elevation-lines-with-gdal-and-postgis/
If anybody has a good source on how to polygonize srtm data from openDEM, please give me a heads up.