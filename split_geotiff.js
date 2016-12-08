var gdal = require('gdal'),
	fs = require('fs'),
	omnivore = require('mapnik-omnivore'),
	exec = require('child_process').exec,
	child;

var filename = process.argv[2],
	interval = parseFloat(process.argv[3]),
	output   = process.argv[4],
	path 	 = process.argv[1].substr(0, process.argv[1].lastIndexOf('/')),
	computeInterval = process.argv[5];

if (!filename || !interval || !output) {
	if(!filename){ console.error('Filename must be provided (first parameter)'); }
	if(!interval){ console.error('Interval must be provided (second parameter)'); }
	if(!output  ){ console.error('Output Path/Filename must be provided (third parameter)'); }
	process.exit(1);
}

var tmp_path = 'temp',
	tmp_geotiff = false;

//Check if temporary export directory exists
try {
	fs.statSync('./'+tmp_path);
} catch (e) {
	fs.mkdirSync('./'+tmp_path);
}

if(filename.indexOf('.vrt')>-1){
	child = exec("gdal_translate -stats "+filename+" "+tmp_path+"/stats.geotiff", function (error, stdout, stderr) {
		if (error !== null) {
			console.log('exec error: ' + error);
		}else{
			tmp_geotiff = true;
			filename = tmp_path+"/stats.geotiff";
			init();
		}
	});
}else{
	init();
}

var min, max, low_bound, high_bound, step;

function init(){
	omnivore.digest(filename, function(err, metadata){
		if (err) return callback(err);
		else {
			min = parseFloat(metadata.raster.bands[0].stats.min);
			max = parseFloat(metadata.raster.bands[0].stats.max);

			if(computeInterval && (computeInterval.toLower() == "true")){
				interval = Math.floor((max - min)/interval);
			}

			low_bound = interval*Math.floor(min/interval);
			high_bound = interval*Math.ceil(max/interval);

			step = low_bound;

			console.log("range:",low_bound,high_bound,interval);

			initProcessBounds();
		}
	});
}

function initProcessBounds(){
	child = exec("gdal_calc.py -A "+filename+" --outfile="+path+"/"+tmp_path+"/level"+step+".geotiff --calc=\""+step+"*(A>"+step+")\" --NoDataValue=0", function (error, stdout, stderr) {
		if (error !== null) {
			console.log('exec error: ' + error);
		}else{
			if(stdout) console.log('stdout: ' + stdout);
			if(stderr) console.log('stderr: ' + stderr);
			polygonizeBounds();
		}
	});
}

function polygonizeBounds(){
	child = exec("gdal_polygonize.py "+path+"/"+tmp_path+"/level"+step+".geotiff -f \"ESRI Shapefile\" "+path+"/"+tmp_path+"/level"+step+".shp level_"+step+" elev", function (error, stdout, stderr) {
		if (error !== null) {
			console.log('exec error: ' + error);
		}else{
			if(stdout) console.log('stdout: ' + stdout);
			if(stderr) console.log('stderr: ' + stderr);

			step += interval;
			if(step <= high_bound){
				setTimeout(initProcessBounds(),1)
			}else{
				if(tmp_geotiff){
					fs.unlinkSync('./'+tmp_path+"/stats.geotiff");
				}
				for(var i = low_bound; i<=high_bound; i+=interval){
					fs.unlinkSync('./'+tmp_path+"/level"+i+".geotiff");
				}
				console.log('unlinking done. exit.')
				process.exit();
			}
		}
	});
}