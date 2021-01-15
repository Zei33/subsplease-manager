// Load data files
progress = 0;
$(() => {
	fs.readFile(remote.app.getAppPath() + `${path.sep}startup.html`, "utf-8", (error, data) => $("body").html(data));
	
	$(".loading-progress").css("width", progress + "%");
	
	dataFolder = remote.app.getAppPath() + `${path.sep}data${path.sep}`;
	
	// Load configuration files.
	$("#loading-status").html("Loading series...");
	try {
		series = JSON.parse(fs.readFileSync(dataFolder + "series.json"));
		if (series == null) throw "Series Empty";
	} catch {
		series = {
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			lastUpdated: 0,
			shows: []
		};
		save("series.json", series);
	}
	progress += 5;
	$(".loading-progress").css("width", progress + "%");
	
	$("#loading-status").html("Loading downloads...");
	
	try {
		downloads = JSON.parse(fs.readFileSync(dataFolder + "downloads.json"));
		if (downloads == null) throw "Series Empty";
	} catch {
		downloads = {
			
		};
		save("downloads.json", downloads);
	}
	progress += 5;
	$(".loading-progress").css("width", progress + "%");
	
	$("#loading-status").html("Loading settings...");
	try {
		settings = JSON.parse(fs.readFileSync(dataFolder + "downloads.json"));
		if (settings == null) throw "Series Empty";
	} catch {
		settings = {
			
		};
		save("settings.json", settings);
	}
	progress += 5;
	$(".loading-progress").css("width", progress + "%");
	
	// Download new series information if data older than 120 minutes.
	if (series.lastUpdated + (1000*60*120) <= Date.now()){
		$("#loading-status").html("Downloading series information...");
		got(`${baseURL}/api/?f=schedule&tz=${Intl.DateTimeFormat().resolvedOptions().timeZone}`)
			.then((response) => {
				var data = JSON.parse(response.body);
				const promises = [];
				var totalShows = 0;
				var totalShowsComplete = 0;
				series.shows = [];
				for (const day in data.schedule){
					for (const show of data.schedule[day]){
						var fileName = (show.image_url.length > 0 ? path.basename(show.image_url) : "");
						if (fileName.length > 0 && !fs.existsSync(remote.app.getAppPath() + `${path.sep}cache${path.sep}` + fileName)){
							totalShows++;
							promises.push(new Promise(function(resolve, reject){
								var file = fs.createWriteStream(remote.app.getAppPath() + `${path.sep}cache${path.sep}` + fileName);
								https.get(baseURL + show.image_url, (response) => {
									response.pipe(file);
								}).on('error', (error) => {
								  console.log(`ERROR: ${error}`);
								}).on('close', () => {
									resolve(true);
									progress += (85 / totalShows);
									totalShowsComplete++;
									$(".loading-progress").css("width", progress + "%");
									$("#loading-status").html(`Downloading series information (${totalShowsComplete} / ${totalShows})...`);
								});
							}));
						}
						
						series.shows.push({
							title: show.title,
							code: show.page,
							day: day,
							time: show.time,
							image: fileName
						});
					}
				}
				if (!totalShows){
					progress += 85;
					$(".loading-progress").css("width", progress + "%");
				}else{
					$("#loading-status").html(`Downloading series information (0 / ${totalShows})...`);
				}
				
				Promise.all(promises)
					.then((results) => {
						series.lastUpdated = Date.now();
						save("series.json", series);
					})
					.catch((error) => console.log(`ERROR: ${error}`));
			})
			.catch((error) => console.log(error));
	}else{
		progress += 85;
		$(".loading-progress").css("width", progress + "%");
	}
	
	var loadCompletionCheck = setInterval(() => {
		$(".loading-progress").css("width", progress + "%");
		if (progress > 99){
			$("#loading-status").html("Loading complete...");
			setTimeout(() => {
				$("#loading-status, .loading-bar").animate({opacity: 0, height: 0}, () => {
					$("#loading-title").delay(200).fadeOut(() => {
						$("head").append($("<script id='dashboard-script' src='./scripts/dashboard.js'></script>"));
						$("#startup-container, #startup-script").remove();
					});
				});
			}, 500);
			
			clearInterval(loadCompletionCheck);
		}
	}, 100);
});