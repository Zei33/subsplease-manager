recentlyAired = [];

function addShow(element, show){
	$(element).append($(`
		<div class="dashboard-row-item" data-show="${show.title}" data-image="${show.image}">
			<div class="dashboard-row-item-info">
				<div class="dashboard-row-item-show-title">${show.title} - ${(show.number == undefined ? "" : "Episode " + show.number)}</div>
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
			addShow("#upcoming-episodes", show);
			$(`.dashboard-row-item[data-image="${show.image}"]`).css("background-image", `url('.${path.sep}cache${path.sep}${show.image}')`);
		}
	}
	
	for (const show of series.shows){
		if (show.day == tomorrowDay && !recentlyAired.includes(show.title)){
			addShow("#upcoming-episodes", show);
			$(`.dashboard-row-item[data-image="${show.image}"]`).css("background-image", `url('.${path.sep}cache${path.sep}${show.image}')`);
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
			for (var i = 0;i <= data.length;i++){
				for (const episode in data[i]){
					var fileName = (data[i][episode].image_url.length > 0 ? path.basename(data[i][episode].image_url) : "");
					addShow("#recent-episodes", {
						title: data[i][episode].show,
						number: data[i][episode].episode,
						image: fileName
					});
					if (i <= 1){
						recentlyAired.push(data[i][episode].show);
						$(`#upcoming-episodes .dashboard-row-item[data-show="${data[i][episode].show}"]`).animate({width: "0px", opacity: "0"});
						$(`#upcoming-episodes .dashboard-row-item[data-show="${data[i][episode].show}"]`).queue(function() {
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
								$(`.dashboard-row-item[data-image="${fileName}"]`).css("background-image", `url('.${path.sep}cache${path.sep}${fileName}')`);
							});
						});
					}else{
						$(`.dashboard-row-item[data-image="${fileName}"]`).css("background-image", `url('.${path.sep}cache${path.sep}${fileName}')`);
					}
				}
			}
		})
		.catch((error) => console.log(error));
}

fs.readFile(remote.app.getAppPath() + `${path.sep}dashboard.html`, "utf-8", (error, data) => $("body").html(data));
$(() => {
	updateUpcoming();
	setInterval(updateUpcoming, 5 * 1000);
	
	updateRecent();
	setInterval(updateRecent, 120 * 1000);
});