const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const axios = require("axios").default;
const fs = require('fs');
const got = require('got');
const cheerio = require('cheerio');

const baseURL = "https://subsplease.org";

window = null;

app.on("ready", () => {
	window = new BrowserWindow({
		width : 1000,
		height: 800,
		title: "SubsPlease Manager",
		frame: false,
		acceptFirstMouse: true,
		center: true,
		titleBarStyle: 'hiddenInset',
		maximizable: false,
		fullscreenable: false,
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true
		}
	});
	
	window.loadFile("index.html");
	window.setFullScreen(false);
	window.webContents.openDevTools();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});