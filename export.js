var	Client = require('pg-native'),
	d3 = require('d3'),
	fs = require('fs'),
	slug = require('slug'),
	config_file = require('./config.json'),
    jsdom = require('jsdom'),
    turf = require('turf'),
    topojson = require('topojson'),
    topojson_simplify = require('topojson-simplify'),
    topojson_client = require('topojson-client');

/* ----------------------------- */

//Extract parameters

//the sequence of attributes to be used in the command line
var config = {
	instance:null,
	script : null,
	xmin   : 12.855709,
	ymin   : 52.270765,
	xmax   : 13.870163,
	ymax   : 52.783299,
	srid   : 4326,
	size   : 2000,
	lines  : 16, //Number of iso lines to generate
	layers : 4,  //Number of segments to generate (lines should ideally be dividable by layers)
	simplify : 0.000005,
	folder : false,
	curve  : false
}, config_key = {};

/*
curve:
	d3.curveBasis
	d3.curveLinear
	d3.curveCardinal
	d3.curveMonotoneX
	d3.curveCatmullRom
*/

var i = 0;
for(var key in config){
	config_key[i] = key;
	i++;
}

process.argv.forEach(function (value, key) {
	if(value == "true"){value = true;}
	else if(value == "false"){value = false;}
	else if(!isNaN(value)){value = parseFloat(value);}
	config[config_key[key]] = value;
});

/* ----------------------------- */

//Connect to database
var client,
	pg_conf = config_file.db;

client = new Client();
client.connectSync("postgres://"+pg_conf.user+":"+pg_conf.password+"@"+pg_conf.host+"/"+pg_conf.database);

/* ----------------------------- */

//Create an export directory and sub-folder

//For more random name generation > Taken from wikipedia (castles from the UK)
function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
    return a;
}

var castles = shuffle(["Someries Castle","Donnington Castle","Windsor Castle","Boarstall Tower","Buckden Palace","Elton Hall","Kimbolton Castle","Kirtling Tower","Longthorpe Tower","Northborough Castle","Woodcroft Castle","Beeston Castle","Chester Castle","Cholmondeley Castle","Doddington Castle","Halton Castle","Peckforton Castle","Auckland Castle","Barnard Castle","Bowes Castle","Brancepeth Castle","Durham Castle","Lambton Castle","Lumley Castle","Mortham Tower","Raby Castle","Raby Old Lodge","Scargill Castle","Walworth Castle","Witton Castle","Caerhays Castle","Carn Brea Castle","Ince Castle","Launceston Castle","Pendennis Castle","Pengersick Castle","Place House, Fowey","Restormel Castle","St Catherine's Castle","St. Mawes Castle","St. Michael's Mount","Tintagel Castle","Trematon Castle","Appleby Castle","Armathwaite Castle","Arnside Tower","Askerton Castle","Beetham Hall","Bewcastle Castle","Bewley Castle","Blencow Hall","Brackenburgh Old Tower","Brackenhill Tower","Branthwaite Hall","Brough Castle","Brougham Castle","Brougham Hall","Broughton Tower","Burneside Hall","Carlisle Castle","Catterlen Hall","Clifton Hall","Cockermouth Castle","Corby Castle","Dacre Castle","Dalston Hall","Dalton Castle","Drawdykes Castle","Drumburgh Castle","Gleaston Castle","Greystoke Castle","Harbybrow Tower","Hayton Castle","Hazelslack Tower","Howgill Castle","Hutton-in-the-Forest","Hutton John","Ingmire Hall","Isel Hall","Kendal Castle","Kentmere Hall","Kirkandrews Tower","Linstock Castle","Lowther Castle","Middleton Hall","Millom Castle","Muncaster Castle","Naworth Castle","Newbiggin Hall","Pendragon Castle","Penrith Castle","Piel Castle","Prior's Tower, Carlisle","Rose Castle","Scaleby Castle","Sizergh Castle","Toppin Castle","Ubarrow Hall","Wharton Hall","Whitehall, Mealsgate","Workington Hall","Wray Castle","Wraysholme Tower","Yanwath Hall","Bolsover Castle","Codnor Castle","Elvaston Castle","Haddon Hall","Mackworth Castle","Peveril Castle","Riber Castle","Wingfield Manor","Affeton Castle","Berry Pomeroy Castle","Bickleigh Castle","Compton Castle","Dartmouth Castle","Castle Drogo","Gidleigh Castle","Hemyock Castle","Kingswear Castle","Lydford Castle","Marisco Castle","Okehampton Castle","Plympton Castle","Powderham Castle","Rougemont Castle","Exeter","Salcombe Castle","Tiverton Castle","Totnes Castle","Watermouth Castle","Brownsea Castle","Christchurch Castle","Corfe Castle","Lulworth Castle","Pennsylvania Castle","Portland Castle","Rufus Castle","Sherborne Old Castle","Woodsford Castle","Paull Holme Tower","Skipsea Castle","Wressle Castle","Bodiam Castle","Camber Castle","Hastings Castle","Herstmonceux Castle","Lewes Castle","Pevensey Castle","Rye Castle Ypres Tower","Colchester Castle","Hadleigh Castle","Hedingham Castle","Walden Castle","Berkeley Castle","Beverstone Castle","St. Briavel's Castle","Sudeley Castle","Thornbury Castle","Tower of London","Radcliffe Tower","Calshot Castle","Hurst Castle","Netley Castle","Odiham Castle","Portchester Castle","Southampton Castle","Southsea Castle","Winchester Castle","Wolvesey Castle","Brampton Bryan Castle","Clifford Castle","Croft Castle","Downton Castle","Eastnor Castle","Goodrich Castle","Hampton Court","Kentchurch Court","Kinnersley Castle","Longtown Castle","Pembridge Castle","Snodhill Castle","Treago Castle","Wigmore Castle","Wilton Castle","Berkhamsted Castle","Hertford Castle","Carisbrooke Castle","Norris Castle","Yarmouth Castle","West Cowes Castle","Cromwell's Castle","Star Castle","Allington Castle","Canterbury Castle","Chiddingstone Castle","Chilham Castle","Cooling Castle","Deal Castle","Dover Castle","Eynsford Castle","Hever Castle","Kingsgate Castle","Leeds Castle","Leybourne Castle","Lullingstone Castle","Lympne Castle","Otford Palace","Penshurst Place","Rochester Castle","St Leonard's Tower, West Malling","Saltwood Castle","Sandgate Castle","Scotney Castle","Sissinghurst Castle","Starkey Castle","Stone Castle","Sutton Valence Castle","Tonbridge Castle","Upnor Castle","Walmer Castle","Westenhanger Castle","Ashton Hall","Borwick Hall","Clitheroe Castle","Hornby Castle","Lancaster Castle","Thurland Castle","Turton Tower","Ashby de la Zouch Castle","Belvoir Castle","Kirby Muxloe Castle","Leicester Castle","Bolingbroke Castle","Grimsthorpe Castle","Hussey Tower","Kyme Tower","Lincoln Castle","Rochford Tower","Somerton Castle","Tattershall Castle","Torksey Castle","Brimstage Hall","Leasowe Castle","Baconsthorpe Castle","Burgh Castle","Caister Castle","Castle Acre Castle","Castle Rising Castle","Claxton Castle","Norwich Castle","Oxburgh Hall","Weeting Castle","Astwell Castle","Barnwell Castle","Rockingham Castle","Thorpe Waterville Castle","Alnham Vicars Pele","Alnwick Castle","Aydon Castle","Bamburgh Castle","Barmoor Castle","Beaufront Castle","Bellister Castle","Belsay Castle","Berwick Castle","Bitchfield Castle","Blenkinsop Castle","Bothal Castle","Bywell Castle","Callaly Castle","Cartington Castle","Chillingham Castle","Chipchase Castle","Cocklaw Tower","Cockle Park Tower","Corbridge Vicar's Pele","Coupland Castle","Craster Tower","Crawley Tower","Cresswell Castle","Dilston Castle","Dunstanburgh Castle","Edlingham Castle","Elsdon Tower","Embleton Tower","Etal Castle","Featherstone Castle","Ford Castle","Halton Castle","Harbottle Castle","Haughton Castle","Hexham Moot Hall and Old Gaol","Horsley Tower, Longhorsley","Langley Castle","Lemmington Hall","Lindisfarne Castle","Mitford Castle","Morpeth Castle","Norham Castle","Preston Tower, Ellingham","Prior Castell's Tower","Prudhoe Castle","Shilbottle Tower","Shortflatt Tower","Thirlwall Castle","Warkworth Castle","Whittingham Tower","Whitton Tower","Willimoteswick Castle","Ayton Castle","Barden Tower","Bolton Castle","Cawood Castle","Clifford's Tower","Crayke Castle","Danby Castle","Gilling Castle","Hazlewood Castle","Hellifield Peel","Helmsley Castle","Hornby Castle","Knaresborough Castle","Marmion Tower","Middleham Castle","Old Mulgrave Castle","Nappa Hall","Pickering Castle","Ravensworth Castle","Richmond Castle","Ripley Castle","Scarborough Castle","Sheriff Hutton Castle","Skelton Castle","Skipton Castle","Snape Castle","South Cowton Castle","Spofforth Castle","Whorlton Castle","Wilton Castle","Halloughton Manor House","Newark Castle","Nottingham Castle","Bampton Castle","Broughton Castle","Hanwell Castle","Oxford Castle","Rotherfield Greys Castle","Shirburn Castle","Wallingford Castle","Oakham Castle","Acton Burnell Castle","Alberbury Castle","Bridgnorth Castle","Broncroft Castle","Cheney Longville Castle","Clun Castle","Hopton Castle","Ludlow Castle","Moreton Corbet Castle","Quatford Castle","Red Castle","Rowton Castle","Shrewsbury Castle","Stokesay Castle","Wattlesborough Castle","Whittington Castle","Banwell Castle","Beckington Castle","Dunster Castle","Farleigh Hungerford Castle","Newton St Loe Castle","Nunney Castle","Stogursey Castle","Sutton Court","Taunton Castle","Walton Castle","Wells Bishop's Palace","Conisbrough Castle","Tickhill Castle","Alton Castle","Caverswall Castle","Chartley Castle","Eccleshall Castle","Stafford Castle","Stourton Castle","Tamworth Castle","Tutbury Castle","Bungay Castle","Clare Castle","Eye Castle","Framlingham Castle","Mettingham Castle","Orford Castle","Wingfield Castle","Farnham Castle","Guildford Castle","Hylton Castle","Newcastle Castle","Old Hollinside","Ravensworth Castle","Tynemouth Castle","Astley Castle","Kenilworth Castle","Maxstoke Castle","Warwick Castle","Dudley Castle","Amberley Castle","Arundel Castle","Bramber Castle","Halnaker House","Old Knepp Castle","Dobroyd Castle","Harewood Castle","Pontefract Castle","Sandal Castle","Devizes Castle","Longford Castle","Ludgershall Castle","Old Sarum Castle","Old Wardour Castle","Caldwall Castle","Hartlebury Castle","Holt Castle","Worcester Castle","Ballyloughan Castle","Ballymoon Castle","Carlow Castle","Huntington Castle","Leighlinbridge Castle","Tinnahinch Castle","Bailieborough Castle","Ballyconnell Castle","Cabra Castle","Saunderson Castle","Cloughoughter Castle","Antrim Castle","Ballycastle Castle","Ballygally Castle","Ballylough Castle","Belfast Castle","Carra Castle","Carrickfergus Castle","Dunaneeny Castle","Dunluce Castle","Dunseverick Castle","Galgorm Castle","Glenarm Castle","Kinbane Castle","Kilwaughter Castle","Lissanoure Castle","Olderfleet Castle","Rathlin Castle or Bruce's Castle","Red Bay Castle","Shane's Castle","Castle Upton","Creevekeeran Castle","Fathom Castle","Gosford Castle","Killeavy Castle","Lurgan Castle or Brownlow House","Moyry Castle","Tandragee Castle","Ardglass Castle","Audley's Castle","Bagenal's Castle","Bangor Castle","Bright Castle","Carrowdore Castle","Castlewellan Castle","Clough Castle","Cowd Castle","Dundrum Castle","Greencastle","Hillsborough Castle","Jordan's Castle","King's Castle","Kilclief Castle","Killyleagh Castle","Kirkistown Castle","Mahee or Nendrum Castle","Margaret's Castle","Myra Castle","Narrow Water Castle","Portaferry Castle","Quintin Castle","Quoile Castle","Sketrick Castle","Stormont Castle","Strangford Castle","Walshestown Castle","Castle Ward","Castle Archdale","Belle Isle Castle","Castle Balfour","Castle Caldwell","Castle Coole","Crevenish Castle","Crom Castle","Old Crom Castle","Enniskillen Castle","Monea Castle","Necarne Castle Castle Irvine","Portora Castle","Tully Castle","Bellaghy Castle","Coleraine Castle","Dungiven Castle","Limavady Castle or O'Cahans Castle","Low Rock Castle","Altinaghree Castle","Augher Castle","Benburb Castle","Castlederg Castle","Caulfield Castle","Dungannon Castle","Harry Avery's Castle","Killymoon Castle","Mountjoy Castle","Roughan Castle","Roxborough Castle","Stewart Castle","Candleston Castle","Coity Castle","Kenfig Castle","Llangynwyd Castle","Newcastle","Caerphilly Castle","Ruperra Castle","Morgraig Castle","Cardiff Castle","Castell Coch","St Fagans Castle","Carreg Cennen Castle","Carmarthen Castle","Dinefwr Castle","Dryslwyn Castle","Kidwelly Castle","Laugharne Castle","Llandovery Castle","Llansteffan Castle","Castell Moel","Newcastle Emlyn Castle","Aberdyfi Castle","Aberystwyth","Caerwedros Castle","Cardigan Castle","Castell Cadwgan, Aberaeron","Dinerth Castle","Gwallter Castle","Lampeter Castle","Llanrhystud Castle","Ystrad Meurig Castle","Ystrad Peithyll Castle","Conwy Castle","Deganwy Castle","Dolwyddelan Castle","Gwrych Castle","Gwydir Castle","Bodelwyddan Castle","Denbigh Castle","Dinas Brân","Dyserth Castle","Rhuddlan Castle","Ruthin Castle","Twthill, Rhuddlan","Prestatyn Castle","Caergwrle Castle","Ewloe Castle","Flint Castle","Hawarden Castle","New Hawarden Castle","Mold Castle","Bryn Bras Castle","Caernarfon Castle","Carndochan Castle","Castell y Bere","Criccieth Castle","Dinas Emrys","Dolbadarn Castle","Harlech Castle","Penrhyn Castle","Castell Aberlleiniog","Beaumaris Castle","Morlais Castle","Cyfarthfa Castle","Abergavenny Castle","Betws Newydd","Caldicot Castle","Castell Arnold","Chepstow Castle","Dingestow Castle","Grosmont Castle","Llanfair Kilgeddin Castle","Llangibby Castle","Llantrisant, Monmouthshire","Castell Troggy","Llanvair Discoed Castle","Monmouth Castle","Newcastle","Penrhos Castle","Pen y Clawdd Castle","Raglan Castle","Skenfrith Castle","Trellech Castle","Usk Castle","White Castle","Neath Castle","Caerleon Castle","Newport Castle","Pencoed Castle","Penhow Castle","Benton Castle","Carew Castle","Cilgerran Castle","Haverfordwest Castle","Llawhaden Castle","Manorbier Castle","Narberth Castle","Pembroke Castle","Picton Castle","Roch Castle","Tenby Castle","Upton Castle","Wiston Castle","Wolf's Castle","Aberedw Castle","Blaenllyfni Castle","Brecon Castle","Bronllys Castle","Crickhowell Castle","Dolforwyn Castle","Hay Castle","Maesllwch Castle","Montgomery Castle","Powis Castle","Tretower Castle","Llantrisant Castle","Loughor Castle","Oxwich Castle","Oystermouth Castle","Pennard Castle","Penrice Castle","Swansea Castle","Weobley Castle","Barry Castle","Fonmon Castle","Hensol Castle","Ogmore Castle","Old Beaupre Castle","Penmark Castle","St Donat's Castle","St Quintins Castle","Chirk Castle","Holt Castle","Bridge Castle","Cairns Castle","Duntarvie Castle","House of the Binns","Linlithgow Palace","Midhope Castle","Murieston Castle","Niddry Castle","Ochiltree Castle","Dumbarton Castle","Dunglass Castle","Balloch Castle","Aberdeen Castle","Abergeldie Castle","Banff Castle","Balmoral Castle","Balquhain Castle","Birse Castle","Bognie Castle","Braemar Castle","Cairnbulg Castle","Cluny Castle","Corgarff Castle","Corse Castle","Coull Castle","Craigievar Castle","Craigston Castle","Crathes Castle","Delgatie Castle","Drum Castle","Drumtochty Castle","Dundarg Castle","Dunnideer Castle","Dunnottar Castle","Eden Castle","Esslemont Castle","Fasque Castle","Fedderate Castle","Fetteresso Castle","Findlater Castle","Castle Forbes","Castle Fraser","Fyvie Castle","Hatton Castle","Glenbuchat Castle","Huntly Castle","Inchdrewer Castle","Inverallochy Castle","Invercauld Castle","Inverugie Castle","Kildrummy Castle","Kincardine Castle","Kindrochit Castle","Kinnaird Castle","Kinnairdy Castle","Kinord Castle","Knock Castle","Knockhall Castle","Lauriston Castle","Leslie Castle","Lonmay Castle","Migvie Castle","Muchalls Castle","Castle Newe","Castle of Park","Pitsligo Castle","Pittulie Castle","Castle of Rattray","Ravenscraig Castle","Slains Castle","Slains Castle","Terpersie Castle","Tolquhon Castle","Udny Castle","Westhall Castle","Affleck Castle","Airlie Castle","Aldbar Castle","Ardestie Castle","Auchmull Castle","Auchterhouse Castle","Auchtermeggities Castle","Baikie Castle","Balcraig Castle","Balfour Castle","Balintore Castle","Ballinshoe Tower","Ballumbie Castle","Bannatyne House","Barnyards Castle","Black Jack's Castle","Blackness Manor House","Bolshan Castle","Bonnyton Castle","Boysack Castle","Braikie Castle","Brandy Den Castle","Brechin Castle","Careston Castle","Carmyllie Castle","Carnegie Castle","Castle of Downie","Castleton of Eassie","Claverhouse Castle, Glamis","Clova Castle","Colliston Castle","Cortachy Castle","Cossans Castle","Coull Castle","Craig Castle","Craig House, Angus","Edzell Castle","Ethie Castle","Farnell Castle","Finavon Castle","Forfar Castle","Glamis Castle","Guthrie Castle","Hatton Castle","Invermark Castle","Inverquharity Castle","Kinnaird Castle","Melgund Castle","Montrose Castle","Red Castle","Achallader Castle","Ardencaple Castle","Aros Castle","Barcaldine Castle","Calgary Castle","Carnasserie Castle","Carrick Castle","Claig Castle","Craignish Castle","Duart Castle","Dunans Castle","Dunaverty Castle","Dundarave Castle","Dunollie Castle","Dunstaffnage Castle","Duntrune Castle","Dunyvaig Castle","Fincharn Castle","Glengorm Castle","Gylen Castle","Innes Chonnel Castle","Inveraray Castle","Kames Castle","Kilchurn Castle","Kilmahew Castle","Kilmartin Castle","Kilmory Castle","Castle Lachlan","Old Castle Lachlan","Minard Castle","Moy Castle","Rothesay Castle","Saddell Castle","Skipness Castle","Castle Stalker","Castle Sween","Tarbert Castle","Torosay Castle","Torrisdale Castle","Castle Toward","Alloa Tower","Broomhall Castle","Clackmannan Tower","Castle Campbell","Menstrie Castle","Sauchie Tower","Abbot's Tower","Amisfield Tower","Annan Castle","Auchen Castle","Auchenrivock Tower","Auchenskeoch Castle","Baldoon Castle","Balmangan Tower","Barclosh Castle","Barholm Castle","Barjarg Tower","Barscobe Castle","Blackethouse Tower","Blacklaw Tower","Bonshaw Tower","Boreland Tower","Breckonside Tower","Breckonside Tower","Brydekirk Tower","Buittle Castle","Buittle Place","Caerlaverock Castle","Cardoness Castle","Carsluith Castle","Castle Kennedy","Castle of Park","Castle of St. John","Castlemilk Tower","Closeburn Castle","Comlongon Castle","Cornal Tower","Corra Castle, Kirkgunzeon","Corsewall Castle","Craigcaffie Castle","Crawfordton Tower","Cruggleton Castle","Cumstoun Castle","Dalswinton Tower","Drumcoltran Tower","Drumlanrig Castle","Dumfries Castle","Dundeugh Castle","Dunskey Castle","Earlstoun Castle","Edingham Castle","Eliock House","Elshieshields Tower","Fourmerkland Tower","Frenchland Tower","Friar's Carse","Galdenoch Castle","Gillesbie Tower","Gilnockie Tower","Glenae Tower","Hills Tower","Hoddom Castle","Isle Tower","Lochar Tower","Isle of Whithorn Castle","Kenmure Castle","Kirkconnell Tower","Kirkcudbright Castle","Lag Tower","Langholm Tower","Lochar Tower","Lochhouse Tower","Lochinch Castle","Old Lochmaben Castle","Lochmaben Castle","Lochnaw Castle","Lochwood Castle","Lockerbie Tower","MacLellan's Castle","Mellingshaw Tower","Morton Castle","Mouswald Tower","Orchardton Tower","Plunton Castle","Raecleugh Tower","Repentance Tower","Robgill Tower","Rusko Castle","Sanquhar Castle","Sorbie Tower","Threave Castle","Tibbers Castle","Torthorwald Castle","Wigtown Castle","Wreaths Tower","Broughty Castle","Claypotts Castle","Dudhope Castle","Dundee Castle","Mains Castle","Powrie Castle","Aiket Castle","Auchencloigh Castle","Barr Castle","Busbie Castle","Caprington Castle","Carnell Castle","Cessnock Castle","Corsehill Castle","Craufurdland Castle","Dean Castle","Dunlop Castle","Haining Place","Kerse Castle","Kilmaurs Castle","Kingencleugh Castle","Lainshaw Castle","Loch Doon Castle","Loudoun Castle","Mauchline Castle","Martnaham Castle","Newmilns Tower","Polkelly Castle","Ravenscraig Castle","Riccarton Castle","Robertland Castle","Rowallan Castle","Sorn Castle","Templehouse Fortalice","Terringzean Castle, East Ayrshire","Trabboch Castle","Bardowie Castle","Craigend Castle","Lennox Castle","Auldhame Castle","Ballencrieff Castle","Barnes Castle","The Bass","Black Castle","Carberry Tower","Dirleton Castle","Dunbar Castle","Fa'side Castle","Fenton Tower","Gamelshiel Castle","Garleton Castle","Hailes Castle","Innerwick Castle","Keith Marischal","Kilspindie Castle","Lennoxlove","Luffness Castle","Penshiel Tower","Preston Tower","Redhouse Castle","Saltcoats Castle","Saltoun Hall","Smeaton House","Stoneypath Tower","Tantallon Castle","Tranent Tower","Waughton Castle","Whittingehame Tower","Yester Castle","Caldwell Castle","Mearns Castle","Polnoon Castle","Barnbougle Castle","Bavelaw Castle","Craigcrook Castle","Craiglockhart Castle","Craigmillar Castle","Cramond Tower","Dundas Castle","Edinburgh Castle","Inchgarvie Castle","Lauriston Castle","Lennox Tower","Liberton Tower","Merchiston Castle","Airth Castle","Almond Castle","Blackness Castle","Castle Cary Castle","Elphinstone Tower","Herbertshire Castle","Kinneil House","Torwood Castle","Abbot House, Dunfermline","Aberdour Castle","Airdit House","Airdre Castle","Aithernie Castle","Ardross Castle, Fife","Ayton Castle, Fife","Balgonie Castle","Ballinbreich Castle","Balwearie Castle","Collairnie Castle","Couston Castle","Craighall Castle","Dairsie Castle","Denmylne Castle","Dunimarle Castle","Earlshall Castle","Falkland Palace","Fernie Castle","Fordell Castle","Hallyards Castle","Kellie Castle","Leuchars Castle","Lochore Castle","Lordscairnie Castle","Macduff's Castle","Myres Castle","Newark Castle","Pittarthie Castle","Piteadie Castle","Pitreavie Castle","Ravenscraig Castle","Rossend Castle","Rosyth Castle","Rumgally House","St Andrews Castle","Scotstarvit Tower","Wemyss Castle","Bishop's Castle, Glasgow","Cathcart Castle","Crookston Castle","Haggs Castle","Partick Castle","Achnacarry Castle","Ackergill Tower","Ardtornish Castle","Ardvreck Castle","Armadale Castle","Ballone Castle","Balnagown Castle","Beaufort Castle","Borve Castle, Benbecula","Borve Castle, Sutherland","Braal Castle","Brahan Castle","Brims Castle","Buchollie Castle","Caisteal Maol","Carbisdale Castle","Castle Chanonry of Ross","Castle of Mey","Cawdor Castle","Castle Craig","Dalcross Castle","Dingwall Castle","Dornoch Castle","Dounreay Castle","Dunbeath Castle","Dun Ringill","Dunrobin Castle","Dunscaith Castle","Duntulm Castle","Dunvegan Castle","Eilean Donan Castle","Erchless Castle","Foulis Castle","Forse Castle","Freswick","Glengarry Castle","Castle Grant","Helmsdale Castle","Invergarry Castle","Inverlochy Castle","Inverness Castle","Keiss Castle","Kilravock Castle","Kinloch Castle","Kinlochaline Castle","Castle Leod","Lochindorb Castle","Milntown Castle","Mingarry Castle","Moniack Castle","Newmore Castle","Ormlie","Ormond Castle","Rait Castle","Redcastle or Castle Roy","Scrabster Castle","Sinclair & Girnigoe Castle","Skibo Castle","Strome Castle","Castle Stuart","Tarradale Castle","Teaninich Castle","Castle Tioram","Tor Castle","Tulloch Castle","Urquhart Castle","Varrich Castle","Ardgowan Castle","Castle Levan","Castle Wemyss","Duchal Castle","Dunrod Castle","Easter Greenock Castle","Newark Castle","Finlaystone Castle","Borthwick Castle","Crichton Castle","Dalhousie Castle","Dalkeith Palace","Hawthornden Castle","Melville Castle","Newbattle Abbey","Roslin Castle","Aikenway Castle","Asliesk Castle","Auchindoun Castle","Ballindalloch Castle","Balvenie Castle","Blairfindy Castle","Blervie Castle","Brodie Castle","Burgie Castle","Coxton Tower","Craigneach Castle","Cullen Castle","Cullen House","Darnaway Castle","Deskie Castle","Deskford Tower","Drumin Castle","Duffus Castle","Dunphail Castle","Elgin Castle","Earnside Castle","Findochty Castle","Forres Castle","Gauldwell Castle","Gordon Castle","Hempriggs Castle","Inverugie Castle","Kilbuaick Castle","Kininvie Castle","Kinneddar Castle","Pitlurg Castle","Quarrelwood Castle","Rothes Castle","Rothiemay Castle","Spynie Palace","Skeith Castle","Castle Stripe","Tor Castle, Dallas","Tronach Castle","Ailsa Craig Castle","Ardrossan Castle","Auchenharvie Castle","Baltersan Castle","Hill of Beith Castle","Broadstone Castle","Brodick Castle","Busbie Castle","Clonbeith Castle","Cloncaird Castle","Corsehill Castle","Little Cumbrae Castle","Cunninghamhead Castle","Dunure Castle","Eglinton Castle","Fairlie Castle","Giffen castle","Glengarnock Castle","Greenan Castle","Hessilhead Castle","Kelburn Castle","Kerelaw Castle","Kersland Castle","Kilbirnie Place","Kildonan Castle","Law Castle","Lochranza Castle","Monkcastle","Montfode Castle","Montgreenan Castle","Pitcon","Portencross Castle","Roughwood Tower","Seagate Castle","Shewalton Castle","Skelmorlie Castle","Stanecastle","Bedlay Castle","Dalzell House","Balfour Castle","Bishop's Palace","Earl's Palace, Birsay","Earl's Palace, Kirkwall","Kirkwall Castle","Noltland Castle","Amhuinnsuidhe Castle","Ardvourlie Castle","Borve Castle","Calvay Castle","Kisimul Castle","Lews Castle","Ormacleit Castle","Ardblair Castle","Arnot Tower","Ashintully Castle","Balhousie Castle","Balmanno Castle","Balthayock Castle","Balvaird Castle","Blackcraig Castle","Blair Castle","Burleigh Castle","Black Castle of Moulin","Castle Cluggy","Castle Huntly","Craighall Castle","Dalnaglar Castle","Drummond Castle","Dupplin Castle","Elcho Castle","Finlarig Castle","Forter Castle","Huntingtower Castle","Kinfauns Castle","Kinnaird Castle, Kinnaird","Lethendy Tower","Loch Leven Castle","Meggernie Castle","Megginch Castle","Castle Menzies","Methven Castle","Murthly Castle","Newton Castle","Perth Castle","Taymouth Castle","Tullibole Castle","Auchenbathie Tower","Barr Castle","Blackhall Manor","Belltrees Peel","Castle Semple","Cochrane Castle","Erskine Castle","Gryffe Castle","Hawkhead Castle","Houston Castle","Inch Castle","Inchinnan Castle","Johnstone Castle","Ranfurly or Ranforlie Castle","Renfrew Castle","Stanely Castle","Ayton Castle","Branxholme Castle","Cessford Castle","Cranshaws","Cavers","Drochil Castle","Dryhope Tower","Duns Castle","Edrington Castle","Fast Castle","Fatlips Castle","Ferniehirst Castle","Floors Castle","Fulton Tower","Greenknowe Tower","Hermitage Castle","Hume Castle","Jedburgh Castle","Kirkhope Tower","Mervinslaw Pele","Neidpath Castle","Newark Castle","Nisbet House","Peebles Castle","Roxburgh Castle","Smailholm Tower","Thirlestane Castle","Traquair House","Venlaw","Wedderburn Castle","Whitslaid Tower","Muness Castle","Scalloway Castle","Ardstinchar Castle","Auchans Castle","Baltersan Castle","Barr Castle","Blairquhan Castle","Craigie Castle","Culzean Castle","Dundonald Castle","Dunduff Castle","Dunure Castle","Fail Castle","Glenapp Castle","Greenan Castle","Killochan Castle","Maybole Castle","Penkill Castle","Sundrum Castle","Thomaston Castle","Turnberry Castle","Bothwell Castle","Calderwood Castle","Cadzow Castle","Craignethan Castle","Crawford Castle","Douglas Castle","Farme Castle","Gilbertfield Castle","Tower of Hallbar","Lee Castle","Mains Castle","Rutherglen Castle","Strathaven Castle","Tarbrax Castle","Airthrey Castle","Ballikinrain Castle","Buchanan Castle","Craigend Castle","Culcreuch Castle","Doune Castle","Edinample Castle","Mugdock Castle","Plean Castle","Stirling Castle"]);

var export_path = './export';

//Check if export directory exists
try {
	fs.statSync(export_path);
} catch (e) {
	fs.mkdirSync(export_path);
}

var export_ready = false,
	export_directory,
	export_i = 0;

if(config.folder){
	export_directory = slug(config.folder);
	try {
		fs.accessSync(export_path+"/"+export_directory, fs.F_OK);
		console.log('folder already exists, we created random folder instead');
	} catch (e) {
		fs.mkdirSync(export_path+"/"+export_directory);
		export_ready = true;
	}	
}

while(!export_ready){
	export_directory = slug(castles[export_i]);
	try {
		fs.accessSync(export_path+"/"+export_directory, fs.F_OK);
	} catch (e) {
		fs.mkdirSync(export_path+"/"+export_directory);
		export_ready = true;
	}	
	export_i++;
}

/* ----------------------------- */

//Getting max/min elevation and calculating isolines bins

var envelope = "ST_MakeEnvelope("+config.xmin+","+config.ymin+","+config.xmax+","+config.ymax+","+config.srid+")";

var rows = client.querySync("SELECT COUNT(*), "+config_file.db.elevation_column+" AS elevation FROM "+config_file.db.table+" WHERE "+config_file.db.geom_column+" && "+envelope+" GROUP BY "+config_file.db.elevation_column+" ORDER BY "+config_file.db.elevation_column+" ASC");

rows.forEach(function(d){
	d.elevation = +d.elevation;
});

var min = d3.min(rows, function(d){ return d.elevation; }),
	max = d3.max(rows, function(d){ return d.elevation; });

var dist = 0, dist_count = 0, pre_dist = 0, min_dist = Number.MAX_VALUE;

for(var i = 0; i<rows.length; i++){
	if(rows[i].elevation<min_dist){
		min_dist = rows[i].elevation;
	}
	if(i === 0){
		pre_dist = rows[i].elevation;
	}else{
		dist += Math.abs(rows[i].elevation - pre_dist);
		dist_count++;
	}
}

var step = dist/dist_count;

//There are less isolines then user wishes to have
if(config.lines > rows.length){
	config.lines = rows.length;
	if(config.lines < config.layers){
		config.layers = config.lines;
	}else{
		//TODO: Optimize to get a nice even divider
		var t = Math.floor(config.lines/config.layers);
		if(t<1){
			config.layers = config.lines;	
		}
	}
}

var height = max - min;
	level = height/config.lines,
	levels = [];

for(var i = 0; i<config.lines; i++){

	var ideal = min + level*i;
	var found = false;

	var plusminus = 0;
	while(!found){
		var t_plus = Math.round(ideal+plusminus);
		var t_minus = Math.round(ideal-plusminus);
		for(var j = 0; j<rows.length; j++){
			if(rows[j].elevation == t_plus && t_plus != levels[levels.length-1]){
				found = true;
				levels.push(t_plus);
			}else if(rows[j].elevation == t_minus && t_minus != levels[levels.length-1]){
				found = true;
				levels.push(t_minus);
			}
		}
		plusminus+=1;
	}
}

/* ----------------------------- */

//Bins are ready, lets get the contours we need

var geojson = {
		type:"FeatureCollection",
		features:[]
	};

var biggerthan = "";
if(config_file.db.table_type!="linestring"){
	biggerthan = ">";
}

for(var i = 0; i<levels.length; i++){
	var rows = client.querySync("SELECT COUNT(*) AS num, ST_AsGeoJSON(ST_Intersection("+envelope+", ST_Union(ST_MakeValid("+config_file.db.geom_column+")))) AS geom FROM "+config_file.db.table+" WHERE "+config_file.db.elevation_column+" "+biggerthan+"= "+levels[i]+" AND "+config_file.db.geom_column+" && "+envelope);

	geojson.features.push({
		type:"Feature",
		geometry:JSON.parse(rows[0].geom),
		properties:{
			elevation:levels[i]
		}
	});
}

//Save GeoJSON
fs.writeFileSync(export_path+"/"+export_directory+'/export.geojson', JSON.stringify(geojson)); //, null, 4

/* ----------------------------- */

//simplify data through topojson

var topology = topojson.topology({contours: geojson});

topojson_simplify.presimplify(topology);
topojson_simplify.simplify(topology,config.simplify);

//Save TopoJSON
fs.writeFileSync(export_path+"/"+export_directory+'/export.topojson', JSON.stringify(topology));

//Calculate extent, scale and ratio to fit into the required image size

var centroid = [
		config.xmin + (config.xmax - config.xmin)/2,
		config.ymin + (config.ymax - config.ymin)/2
	];

var initScale = 20000;

var projection = d3.geoMercator()
	.center(centroid)
    .scale(initScale)
    .translate([config.size / 2, config.size / 2]);

var path = d3.geoPath()
    .projection(projection);

var p1 = projection([config.xmin, config.ymin]),
	p2 = projection([config.xmax, config.ymax]);

var xmax,ymax,ymin,xmin;

	if(p1[0]>p2[0]){xmax=p1[0];xmin=p2[0];}else{xmax=p2[0];xmin=p1[0];}
	if(p1[1]>p2[1]){ymax=p1[1];ymin=p2[1];}else{ymax=p2[1];ymin=p1[1];}

var bounds = [[xmin,ymin],[xmax,ymax]],
	dx = bounds[1][0] - bounds[0][0],
	dy = bounds[1][1] - bounds[0][1],
	scale = 0.95 * initScale * Math.min(config.size / dx , config.size / dy);
	projection.scale(scale);

var width, height;

	if(dx > dy){
		width = config.size;
		height = config.size/dx * dy;
	}else{
		height = config.size;
		width = config.size/dy * dx;
	}

	projection.translate([width/2, height/2]);

var features = {
		type:"FeatureCollection",
		features:[]
	};

//Clean the data a bit (removing small bits and holes)

var minArea = 2000000/(scale/20000);

function addFeature(feature){
	var a = [];
	if(feature.geometry.type == "LineString"){
		a.push(feature.geometry);
	}else if(feature.geometry.type == "MultiLineString"){
		a.push(feature.geometry);
	}else if(feature.geometry.type == "Polygon"){
		var area = turf.area(feature);
		if(area > (minArea)){
			a.push(feature.geometry);			
		}
	}else if(feature.geometry.type == "MultiPolygon"){
		for(var j = 0; j<feature.geometry.coordinates.length; j++){
			var newFeature = {
				type:'Feature',
				properties:feature.properties,
				geometry:{
					type:'Polygon',
					coordinates:feature.geometry.coordinates[j]
				}
			};

			var area = turf.area(newFeature);

			if(area > (minArea)){
				var newCoordinates = [];
				for(var k = 0; k<newFeature.geometry.coordinates.length; k++){
					var innerArea = turf.area(turf.polygon([newFeature.geometry.coordinates[k]]));
					if(innerArea>(minArea)){
						newCoordinates.push(newFeature.geometry.coordinates[k]);
					}
				}

				newFeature.geometry.coordinates = newCoordinates;
				a.push(newFeature.geometry);
			}
		}
	}else{
		console.log(feature.geometry.type);
	}
	return a;
}

//We don't want a lot of small bits and pieces, therefore we remove small polygons and small holes inside polygons
//The area limit for 
var geoTopo = topojson_client.feature(topology, topology.objects.contours).features;
for(var i = 0; i<geoTopo.length; i++){
	var feature = {
		type:"Feature",
		properties:{
			elevation:geoTopo[i].properties.elevation
		},
		geometry:{
			type:"GeometryCollection",
			geometries:[]
		}
	};

	if(geoTopo[i].type == "FeatureCollection"){
		for(var j = 0; j<geoTopo[i].features.length; j++){
			feature.geometry.geometries = feature.geometry.geometries.concat(addFeature(geoTopo[i].features[j]));
		}
	}else if(geoTopo[i].geometry.type == "GeometryCollection"){
		for(var j = 0; j<geoTopo[i].geometry.geometries.length; j++){
			feature.geometry.geometries = feature.geometry.geometries.concat(addFeature({type:"Feature", geometry:geoTopo[i].geometry.geometries[j]}));
		}
	}else{
		feature.geometry.geometries = feature.geometry.geometries.concat(addFeature(geoTopo[i]));
	}

	features.features.push(feature);
}

fs.writeFileSync(export_path+"/"+export_directory+'/export_filter.geojson', JSON.stringify(features));

//Smoothing pathes

var interpolate = d3.line()
	.x(function(d){ return d[0] })
	.y(function(d){ return d[1] });

if(config.curve){
	interpolate.curve(eval(config.curve));
}

var smoothPath = function(pstr){
	var r = "";
	pstr.geometry.geometries.forEach(function(d){
		var p = path(d);
		if(p == undefined){
			//do nothing
		}else{
			var str = "";
			if(d.type == "Polygon" || d.type == "MultiPolygon"){
				var sps = p.substr(1).split("ZM");
			}else{
				var sps = p.substr(1).split("M");
			}			
			for(var s = 0; s<sps.length; s++){
				sp = sps[s].replace("Z", "").split("L").map(function(d){ return d.split(",") });
				str += interpolate(sp);
				if(d.type == "Polygon" || d.type == "MultiPolygon"){
					str += "Z";
				}
			}
			r += str;
		}
	});
	if(r==""){
		r = undefined;
	}
	return r;
}

//Drawing the isolines

var file = 0;
var steps = Math.floor(config.lines / config.layers);

jsdom.env({
    html:'',
    features:{ QuerySelector:true },
    done:function(errors, window){
    	window.d3 = d3.select(window.document);

		for(var f = 0; f<features.features.length; f+=steps){

			var svg = window.d3.select("body").append("div").attr('id','id_'+f).append('svg')
				.attr("version","1.1")
				.attr("xmlns","http://www.w3.org/2000/svg")
				.attr("xmlns:xlink","http://www.w3.org/1999/xlink")
				.attr("x","0px")
				.attr("y","0px")
				.attr("width",width+'px')
				.attr("height",height+'px')
				.attr("viewBox", '0 0 '+width+' '+height)
				.attr("xml:space", "preserve");

			var group = svg.append('g');

			for(var ff = (f+1); ff<f+steps+1 && ff<features.features.length; ff++){
				group.append('g').append("path")
					.datum(features.features[ff])
					.style('stroke','black')
					.style('fill','rgba(0,0,0,0)')
					.attr("d", function(d){
						return smoothPath(d);
					});
			}

			var p1 = projection([config.xmin, config.ymin]),
				p2 = projection([config.xmax, config.ymax]);

			var xmax,ymax,ymin,xmin;

			if(p1[0]>p2[0]){xmax=p1[0];xmin=p2[0];}else{xmax=p2[0];xmin=p1[0];}
			if(p1[1]>p2[1]){ymax=p1[1];ymin=p2[1];}else{ymax=p2[1];ymin=p1[1];}

			svg.append('g').append("path")
				.datum(features.features[f])
				.style('stroke','red')
				.style('fill','rgba(0,0,0,0)')
				.attr("d", function(d){
					return smoothPath(d);
				});

			svg.append('rect')
				.style('fill','rgba(0,0,0,0)')
				.style('stroke','green')
				.attr('x', xmin)
				.attr('y', ymin)
				.attr('width', xmax-xmin)
				.attr('height', ymax-ymin);

			html += '<img src="export_svg_'+file+'.svg" style="width:500px; height:auto;" />';
			fs.writeFileSync(export_path+'/'+export_directory+'/export_svg_'+file+'.svg', '<?xml version="1.0" encoding="utf-8"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'+window.d3.select('#id_'+f).html());
			file++;
		}

		var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>img{position:absolute;left:100px;top:'+(20+file*40)+'px;transition:all 1s ease;transform:scaleY(0.5) skew(-20deg, 20deg);}';

		for(var f = 0; f<features.features.length; f+=steps){
			html += '.container:hover img.layer_'+(features.features.length/steps - (f/steps) - 1)+'{top:'+(20+40*(f/steps))+'px;}';
		}

		html += '</style></head><body><div class="container">';

		for(var f = 0; f<features.features.length; f+=steps){
			html += '<img class="layer_'+(features.features.length/steps - (f/steps) - 1)+'" src="export_svg_'+(features.features.length/steps - (f/steps) - 1)+'.svg" style="width:500px; height:auto;" />';
		}

		fs.writeFileSync(export_path+'/'+export_directory+'/export.html', html+'</div></body></html>');

		var topology = topojson.topology({contours: features});
		topojson_simplify.presimplify(topology);
		topojson_simplify.simplify(topology, config.simplify);

		//Save TopoJSON
		fs.writeFileSync(export_path+"/"+export_directory+'/export_filter.topojson', JSON.stringify(topology));

	}
});