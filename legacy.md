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

