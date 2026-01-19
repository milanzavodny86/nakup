function doGet(e) {
  const data = getData();
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    saveData(contents);
    return ContentService.createTextOutput(JSON.stringify({status: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getData() {
  const fileName = "Nakup_DB.json";
  try {
    const files = DriveApp.getFilesByName(fileName);
    if (files.hasNext()) {
      const file = files.next();
      const content = file.getBlob().getDataAsString();
      return JSON.parse(content);
    }
  } catch (e) {
    Logger.log("Chyba pri čítaní: " + e.toString());
  }
  return { products: [] };
}

function saveData(data) {
  const fileName = "Nakup_DB.json";
  const files = DriveApp.getFilesByName(fileName);
  const jsonString = JSON.stringify(data);
  
  if (files.hasNext()) {
    files.next().setContent(jsonString);
  } else {
    DriveApp.createFile(fileName, jsonString);
  }
}