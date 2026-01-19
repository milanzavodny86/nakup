function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify(getData()))
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
  const fileName = "Nakup_Database.json";
  const files = DriveApp.getFilesByName(fileName);
  if (files.hasNext()) {
    const content = files.next().getBlob().getDataAsString();
    return JSON.parse(content);
  }
  return { products: [] };
}

function saveData(data) {
  const fileName = "Nakup_Database.json";
  const files = DriveApp.getFilesByName(fileName);
  const jsonString = JSON.stringify(data);
  if (files.hasNext()) {
    files.next().setContent(jsonString);
  } else {
    DriveApp.createFile(fileName, jsonString);
  }
}