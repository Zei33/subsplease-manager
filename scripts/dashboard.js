recentlyAired = [];

function addShow(element, show, controls){
	$(element).append($(`
		<div class="dashboard-item-container" data-show="${show.title}" data-image="${show.image}">
			<div class="dashboard-item">
				<div class="dashboard-item-image"></div><!--
			 --><div class="dashboard-item-controls">
					${(controls.download ? '<div class="dashboard-item-control">Download Episode</div>' : '')}<!--
				 -->${(controls.view ? '<div class="dashboard-item-control">View Series</div>' : '')}
				</div>
			</div><!--
		 --><div class="dashboard-item-info">
				<div class="dashboard-item-info-title">${show.title}</div>
				<small class="dashboard-item-info-episode">${(show.number == undefined ? "" : "Episode " + show.number)}</small>
			</div>
		</div>
	`));
}

function updateUpcoming(){
	var currentDay = new Intl.DateTimeFormat("en-US", {weekday: "long"}).format(Date.now());
	var tomorrowDay = new Intl.DateTimeFormat("en-US", {weekday: "long"}).format(new Date().setDate(new Date().getDate() + 1));
	
	$("#upcoming-episodes").html("");
	for (const show of series.shows){
		if (show.day == currentDay && !recentlyAired.includes(show.title)){
			console.log(show.day + " " + currentDay + ": " + show.title);
			addShow("#upcoming-episodes", show, { view: true });
			if (show.image.length > 0){
				$(`.dashboard-item-container[data-image="${show.image}"] .dashboard-item-image`).css("background-image", `url('.${path.sep}cache${path.sep}${show.image}')`);
			}else{
				$(`.dashboard-item-container[data-image="${show.image}"] .dashboard-item`).css("animation", `hue 15s ease infinite`);
			}
		}
	}
	
	for (const show of series.shows){
		if (show.day == tomorrowDay && !recentlyAired.includes(show.title)){
			console.log(show.day + " " + currentDay + ": " + show.title);
			addShow("#upcoming-episodes", show, { view: true });
			if (show.image.length > 0){
				$(`.dashboard-item-container[data-image="${show.image}"] .dashboard-item-image`).css("background-image", `url('.${path.sep}cache${path.sep}${show.image}')`);
			}else{
				$(`.dashboard-item-container[data-image="${show.image}"] .dashboard-item`).css("animation", `hue 15s ease infinite`);
			}
		}
	}
}

function updateRecent(){
	recentlyAired = [];
	var promises = [];
	for (var i = 0;i <= 2;i++){
		promises.push(
			got(`${baseURL}/api/?f=latest&tz=${Intl.DateTimeFormat().resolvedOptions().timeZone}&p=${i}`)
				.then((response) => {
					return JSON.parse(response.body);
				})
				.catch((error) => console.log(error))
		);
	}
	
	Promise.all(promises)
		.then((data) => {
			$("#recent-episodes").html("");
			for (var i = 0;i <= data.length;i++){
				for (const episode in data[i]){
					var fileName = (data[i][episode].image_url.length > 0 ? path.basename(data[i][episode].image_url) : "");
					addShow("#recent-episodes", {
						title: data[i][episode].show,
						number: data[i][episode].episode,
						image: fileName
					}, { view: true, download: true });
					if (i <= 1){
						recentlyAired.push(data[i][episode].show);
						$(`#upcoming-episodes .dashboard-item-container[data-show="${data[i][episode].show}"]`).animate({width: "0px", opacity: "0"});
						$(`#upcoming-episodes .dashboard-item-container[data-show="${data[i][episode].show}"]`).queue(function() {
							setTimeout(() => {
								$(this).remove();
								$(this).dequeue();
							}, 100);
						});
					}
					if (fileName.length > 0 && !fs.existsSync(remote.app.getAppPath() + `${path.sep}cache${path.sep}` + fileName)){
						new Promise(function(resolve, reject){
							var file = fs.createWriteStream(remote.app.getAppPath() + `${path.sep}cache${path.sep}` + fileName);
							https.get(baseURL + data[i][episode].image_url, (response) => {
								response.pipe(file);
							}).on('error', (error) => {
							  console.log(`ERROR: ${error}`);
							}).on('close', () => {
								resolve(true);
								$(`.dashboard-item-container[data-image="${fileName}"] .dashboard-item-image`).css("background-image", `url('.${path.sep}cache${path.sep}${fileName}')`);
							});
						});
					}else if (fileName.length == 0){
						$(`.dashboard-item-container[data-image="${fileName}"] .dashboard-item`).css("animation", "hue 15s ease infinite");
					}else{
						$(`.dashboard-item-container[data-image="${fileName}"] .dashboard-item-image`).css("background-image", `url('.${path.sep}cache${path.sep}${fileName}')`);
					}
				}
			}
		})
		.catch((error) => console.log(error));
}

fs.readFile(remote.app.getAppPath() + `${path.sep}dashboard.html`, "utf-8", (error, data) => $("body").html(data));
$(() => {
	setTimeout(updateUpcoming, 10);
	setInterval(updateUpcoming, 1000 * 1000);
	
	setTimeout(updateRecent, 10);
	setInterval(updateRecent, 1000 * 1000);
});