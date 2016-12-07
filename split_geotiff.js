var gdal = require('gdal'),
	omnivore = require('mapnik-omnivore');
//var util = require('util');


var filename = process.argv[2],
	interval = process.argv[3],
	output   = process.argv[4];

if (!filename || !interval || !output) {
	
	if(!filename){ console.error('Filename must be provided (first parameter)'); }
	if(!interval){ console.error('Interval must be provided (second parameter)'); }
	if(!output  ){ console.error('Output Path/Filename must be provided (third parameter)'); }

	process.exit(1);
}

//var ds = gdal.open(filename, "r", "GTiff", undefined, undefined, 1);
//console.log(ds.bands.DatasetBands.getStatistics());

omnivore.digest(filename, function(err, metadata){
    if (err) return callback(err);
    else {
        console.log('Metadata returned!');
        console.log(metadata.raster.bands[0]);
    }
});




/*

#getting maximum and minimum from the histogram of our GeoTiff
gdal_translate -stats srtm_cgiar.vrt srtm_cgiar_stats.geotiff
gdalinfo -mm srtm_cgiar_stats.geotiff
min_elev = ...;
max_elev = ...;

#interval of contour lines in meters
interval = 100;

low_bound = interval*round(min_elev/interval);
high_bound = interval*round(max_elev/interval);

%% Start loop to create levels for all elevation intervals
for i = low_bound:interval:high_bound

	
	% Raster slicing elevation levels
	cmd = ['!gdal_calc.py -A ',dem_name,' --outfile=level',num2str(i),'.tif --calc="',num2str(i),'*(A>',num2str(i),')" --NoDataValue=0'];
	eval(cmd);
	clear cmd
	
	% Polygonize raster slices
	cmd = ['!gdal_polygonize.py level',num2str(i),'.tif -f "ESRI Shapefile" level',num2str(i),'.shp level_',num2str(i),' elev'];
	eval(cmd);
	clear cmd
 
end

%% Merge all levels into one shapefile

% Create levels.shp to append all other levels to
cmd = ['!ogr2ogr levels.shp level',num2str(low_bound),'.shp'];
eval(cmd);
clear cmd

% Append all other levels onto levels.shp
for i = (low_bound+interval):interval:high_bound
	
	cmd = ['!ogr2ogr -update -append levels.shp level',num2str(i),'.shp'];
	eval(cmd);
	clear cmd
	
end

%% Convert ESRI shapefile to GeoJSON

cmd = ['!ogr2ogr -f GeoJSON ',output_prefix,'.json levels.shp'];
eval(cmd);

*/