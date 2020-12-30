series = null;
downloads = null;
settings = null;

function save(file, object){
	fs.writeFile(remote.app.getAppPath() + `${path.sep}data${path.sep}` + file, JSON.stringify(object, null, 2), (error) => {
		if (error) console.log(error);
	});
}