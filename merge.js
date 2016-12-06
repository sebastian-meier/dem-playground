var	Client = require('pg-native'),
    fs = require('fs');

var client,
	pg_conf = {
		database:'sebastianmeier',
		user:'sebastianmeier',
		password:'',
		port:5432,
		host:"localhost",
		ssl:false
	};

client = new Client();
client.connectSync("postgres://"+pg_conf.user+":"+pg_conf.password+"@"+pg_conf.host+"/"+pg_conf.database);
client.querySync('UPDATE dem SET state = 1 WHERE state > 1');
client.querySync('TRUNCATE dem_polygon RESTART IDENTITY');

var count = 0;

var processed = [];

function combined(a, key){
	var aa = [];
	for(var i = 0; i<a.length; i++){
		aa.push(a[i][key]);
	}
	return aa.join(',');
}

function geoWhere(a,num){
	var r = '';

	for(var i = a.length-(num); i<a.length; i++){
		if(r!=''){r+=' OR ';}
		
		var start = a[i].start_x+' '+a[i].start_y;
		var end = a[i].end_x+' '+a[i].end_y;
		var start_n = a[i].start_n_x+' '+a[i].start_n_y;
		var end_n = a[i].end_n_x+' '+a[i].end_n_y;
		
		r += ' start_point = ST_SetSRID(ST_GeomFromText(\'POINT('+start+')\'),4326) OR      end_n_point = ST_SetSRID(ST_GeomFromText(\'POINT('+start+')\'),4326) ';
		r += ' OR start_point = ST_SetSRID(ST_GeomFromText(\'POINT('+end+')\'),4326) OR     end_n_point = ST_SetSRID(ST_GeomFromText(\'POINT('+end+')\'),4326) ';
		r += ' OR start_point = ST_SetSRID(ST_GeomFromText(\'POINT('+start_n+')\'),4326) OR end_n_point = ST_SetSRID(ST_GeomFromText(\'POINT('+start_n+')\'),4326) ';
		r += ' OR start_point = ST_SetSRID(ST_GeomFromText(\'POINT('+end_n+')\'),4326) OR   end_n_point = ST_SetSRID(ST_GeomFromText(\'POINT('+end_n+')\'),4326) ';

		r += ' OR start_n_point = ST_SetSRID(ST_GeomFromText(\'POINT('+start+')\'),4326) OR   end_n_point = ST_SetSRID(ST_GeomFromText(\'POINT('+start+')\'),4326) ';
		r += ' OR start_n_point = ST_SetSRID(ST_GeomFromText(\'POINT('+end+')\'),4326) OR     end_n_point = ST_SetSRID(ST_GeomFromText(\'POINT('+end+')\'),4326) ';
		r += ' OR start_n_point = ST_SetSRID(ST_GeomFromText(\'POINT('+start_n+')\'),4326) OR end_n_point = ST_SetSRID(ST_GeomFromText(\'POINT('+start_n+')\'),4326) ';
		r += ' OR start_n_point = ST_SetSRID(ST_GeomFromText(\'POINT('+end_n+')\'),4326) OR   end_n_point = ST_SetSRID(ST_GeomFromText(\'POINT('+end_n+')\'),4326) ';
	}

	return r;
}

function getConnections(processed, num){
	return client.querySync('SELECT ST_X(start_n_point) AS start_n_x, ST_Y(start_n_point) AS start_n_y,'+
								'   ST_X(start_point) AS start_x, ST_Y(start_point) AS start_y,'+
								'   ST_X(end_n_point) AS end_n_x, ST_Y(end_n_point) AS end_n_y,'+
								'   ST_X(end_point) AS end_x, ST_Y(end_point) AS end_y,'+
								'   ST_AsGeoJSON(wkb_geometry) AS geom, ogc_fid AS id, elevation FROM dem WHERE '+
								' state = 1 '+
								' AND elevation = '+processed[0].elevation+
								' AND NOT ogc_fid in ('+combined(processed,'id')+') '+
								' AND ('+geoWhere(processed, num)+')'
							);
}

function processData(){
	processed = [];
	count++;

	var result = client.querySync('SELECT ST_X(start_n_point) AS start_n_x, ST_Y(start_n_point) AS start_n_y,'+
								'   ST_X(start_point) AS start_x, ST_Y(start_point) AS start_y,'+
								'   ST_X(end_n_point) AS end_n_x, ST_Y(end_n_point) AS end_n_y,'+
								'   ST_X(end_point) AS end_x, ST_Y(end_point) AS end_y,'+
								'   ST_AsGeoJSON(wkb_geometry) AS geom, ogc_fid AS id, elevation FROM dem WHERE state = 1 AND elevation = 350.000 AND wkb_geometry && ST_MakeEnvelope(5.952,45.946,7.027,47.058,4326) LIMIT 1');
	if(result.length >= 1){
		console.log(result[0].id);

		processed.push(result[0]);

		var intersections = getConnections(processed,1);

		var w = 0;
		while(intersections.length >= 1){
			w++;
			//console.log(w, intersections.length, processed.length);
			for(var i = 0; i<intersections.length;i++){
				processed.push(intersections[i]);
			}
			intersections = getConnections(processed,intersections.length);			
		}

		for(var i = 0; i<processed.length; i++){
			processed[i].geom = (JSON.parse(processed[i].geom)).coordinates;
		}

		var segments = [];
		for(var i = 0; i<processed.length; i++){
			segments.push(processed[i].geom);
		}
		
		if(processed.length > 1){
			/*var notfound = false;
			for(var i = 0; i<segments.length; i++){
				var ffound = false;
				var found = false;
				for(var j = 0; j<segments.length; j++){
					if(i!=j){

						//beginning to end
						if(segments[i][0][0] == segments[j][segments[j].length-1][0] && 
						   segments[i][0][1] == segments[j][segments[j].length-1][1] && !found){
							found = true;
							console.log('last/first');
						}

						if(segments[i].length>=2){
							if(segments[i][1][0] == segments[j][segments[j].length-1][0] && 
							   segments[i][1][1] == segments[j][segments[j].length-1][1] && !found){
								found = true;
								segments[i].splice(0,1);
								console.log('last/first+1');
							}
						}

						if(segments[j].length >= 2){
							if(segments[i][0][0] == segments[j][segments[j].length-2][0] && 
							   segments[i][0][1] == segments[j][segments[j].length-2][1] && !found){
								found = true;
								segments[j].splice(segments[j].length-1,1);
								console.log('last-1/first');
							}
						}

						if(segments[i].length>=2 && segments[j].length >= 2){
							if(segments[i][1][0] == segments[j][segments[j].length-2][0] && 
							   segments[i][1][1] == segments[j][segments[j].length-2][1] && !found){
								found = true;
								segments[i].splice(0,1);
								segments[j].splice(segments[j].length-1,1);
								console.log('last-1/first+1');
							}
						}

						//end to beginning

						if(segments[i][segments[i].length-1][0] == segments[j][0][0] && 
						   segments[i][segments[i].length-1][1] == segments[j][0][1] && !ffound){
							ffound = true;
							console.log('re:last/first');
						}

						if(segments[i].length>=2){
							if(segments[i][segments[i].length-2][0] == segments[j][0][0] && 
							   segments[i][segments[i].length-2][1] == segments[j][0][1] && !ffound){
								ffound = true;
								segments[i].splice(segments[i].length-1,1);
								console.log('re:last/first+1');
							}
						}

						if(segments[j].length >= 2){
							if(segments[i][segments[i].length-1][0] == segments[j][1][0] && 
							   segments[i][segments[i].length-1][1] == segments[j][1][1] && !ffound){
								ffound = true;
								segments[j].splice(0,1);
								console.log('re:last-1/first');
							}
						}

						if(segments[i].length>=2 && segments[j].length >= 2){
							if(segments[i][segments[i].length-2][0] == segments[j][1][0] && 
							   segments[i][segments[i].length-2][1] == segments[j][1][1] && !ffound){
								ffound = true;
								segments[i].splice(segments[i].length-1,1);
								segments[j].splice(0,1);
								console.log('re:last-1/first+1');
							}
						}

					}
				}

				if(!found && !ffound){
					console.log("not found");
					notfound = true;
				}

			}

			/*if(notfound){
				fs.writeFile('output.json', JSON.stringify(segments), function (err) {
	                if (err) return console.log(err);
	                console.log("exit 1");
	                process.exit();
	            });
			}else{*/

				/*var tsegments = [segments[0]];
				var add = [0];
				var added = false;
				var acount = 1;

				while(acount < segments.length){
					for(var i = 1; i<segments.length && !added; i++){
						if(add.indexOf(i)==-1){
							if( tsegments[tsegments.length-1][tsegments[tsegments.length-1].length-1][0] == segments[i][0][0] &&
								tsegments[tsegments.length-1][tsegments[tsegments.length-1].length-1][1] == segments[i][0][1]
								){

								added = true;
								add.push(i);
								tsegments.push(segments[i]);
							}else if( tsegments[0][0][0] == segments[i][segments[i].length-1][0] &&
								tsegments[0][0][1] == segments[i][segments[i].length-1][1]
								){

								added = true;
								add.push(i);
								tsegments.splice(0,0,segments[i]);
							}else{
								console.log("drop");
							}
						}
					}
					acount++;
				}

				segments = tsegments;*/

			}
		//}

		for(var i = 0; i<segments.length; i++){
			if(segments[i].length<2){
				if(i == segments.length-1){
					segments[i-1].push(segments[i][0]);
				}else{
					segments[i+1].splice(0,0,segments[i][0]);
				}
				segments.splice(i,1);
				//short segment
			}
		}

		if(segments[0][0][0] != segments[segments.length-1][segments[segments.length-1].length-1][0] || segments[0][0][1] != segments[segments.length-1][segments[segments.length-1].length-1][1]){
			segments[segments.length-1].push(segments[0][0]);
			console.log("closed")
		}

		//console.log(segments);

		//console.log(segments)

		var geomStr = '';

		for(var i = 0; i<segments.length; i++){
			if(geomStr!=''){
				geomStr += ',';
			}
			geomStr += "(";
			for(var j = 0; j<segments[i].length; j++){
				if(j>0){
					geomStr += ',';
				}
				geomStr += segments[i][j][0]+' '+segments[i][j][1];
			}
			geomStr += ")";
		}

		//console.log(geomStr);

		try{
			client.querySync('INSERT INTO dem_polygon (geom, elevation, merged)VALUES('+
							'ST_MakeValid('+
								//'ST_MakePolygon('+
									'ST_LineMerge(ST_SetSRID(ST_GeomFromText(\'MULTILINESTRING('+geomStr+')\'),4326))'+
								//')'+
							')'+
							','+processed[0].elevation+','+processed.length+')');
		}catch(err){
			fs.writeFile('output.json', JSON.stringify(segments, null, 4), function (err) {
                if (err) return console.log(err);
                console.log("exit 2");
                process.exit();
            });
		}

		/*

		for(var i = 0; i<segments.length; i++){
			for(var j = 0; j<segments[i].length; j++){
				if(geomStr!=''){
					geomStr += ',';
				}
				geomStr += segments[i][j][0]+' '+segments[i][j][1];
			}
		}

		client.querySync('INSERT INTO dem_polygon (geom, elevation, merged)VALUES('+
						'ST_MakeValid('+
							'ST_MakePolygon('+
								'ST_SetSRID(ST_GeomFromText(\'LINESTRING('+geomStr+')\'),4326)'+
							')'+
						')'+
						','+processed[0].elevation+','+processed.length+')');
		*/

		client.querySync('UPDATE dem SET state = 2 WHERE ogc_fid in ('+combined(processed,'id')+')');
		console.log('Merged',processed.length,count);

		setTimeout(processData,0);

	}else{
		console.log("done");
	}
}

processData();