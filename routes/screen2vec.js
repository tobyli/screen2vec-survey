var express = require('express');
var router = express.Router();
var fs = require('fs');

/* GET users listing. */

var datasetPath = "res/test_dataset";
var availableModels = JSON.parse("[\"Screen2Vec\", \"visualOnly\", \"layoutOnly\", \"textOnly\"]");

router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

function getDatasetNames(datasetPath, callback) {
    let datasetNames = [];
    fs.readdir(datasetPath, function (err, items) {
        for (item in items) {
            if (items[item].startsWith(".")) {
                continue;
            }
            datasetNames.push(items[item]);
        }
        callback(datasetNames);
    });
}

//Get the list of all the available datasets
router.get('/get-dataset-names', function (req, res, next) {
    getDatasetNames(datasetPath, function (datasetNames) {
        res.setHeader('content-type', 'application/json');
        res.setHeader('content-disposition', 'inline');
        res.send(datasetNames);
    });
});

//Get the list of all the available models
router.get('/get-model-names', function (req, res, next) {
    res.setHeader('content-type', 'application/json');
    res.setHeader('content-disposition', 'inline');
    res.send(availableModels);
});

//Get the source json of a dataset
router.get('/get-source-json', function (req, res, next) {
    let dataName = req.query.dataName;
    //validate if the dataName is valid
    getDatasetNames (datasetPath, function (datasetNames) {
        if (datasetNames.includes(dataName)) {
            res.setHeader('content-type', 'application/json');
            res.setHeader('content-disposition', 'inline');
            fs.readFile(`${datasetPath}/${dataName}/src.json`, function (err, data) {
                if (data !== undefined) {
                    res.send(data.toString());
                } else {
                    res.send("Can't find the dataset");
                }
            });
        } else {
            res.send("Illegal data name!");
        }
    });
});

//Get the source image of a dataset
router.get('/get-source-image', function (req, res, next) {
    let dataName = req.query.dataName;
    //validate if the dataName is valid
    getDatasetNames (datasetPath, function (datasetNames) {
        if (datasetNames.includes(dataName)) {
            res.setHeader('content-type', 'image/png');
            res.setHeader('content-disposition', 'inline');
            fs.readFile(`${datasetPath}/${dataName}/src.png`, function (err, data) {
                if (data !== undefined) {
                    res.send(data);
                } else {
                    res.send("Can't find the dataset");
                }
            });
        } else {
            res.send("Illegal data name!");
        }
    });
});

//Get all candidate jsons of a model (include union) for a dataset
router.get('/get-candidate-json', function (req, res, next) {
    let dataName = req.query.dataName;
    let modelName = req.query.modelName;
    //validate if the dataName is valid
    let modelNamesToUse = [];
    let candidateJsons = {};
    getDatasetNames(datasetPath, function (datasetNames) {
        if (datasetNames.includes(dataName) && (availableModels.includes(modelName) || modelName === "union")) {
            res.setHeader('content-type', 'application/json');
            res.setHeader('content-disposition', 'inline');

            if (modelName === "union") {
                modelNamesToUse = availableModels;
            } else {
                modelNamesToUse.push(modelName);
            }

            for (const i in modelNamesToUse) {
                let modelPath = `${datasetPath}/${dataName}/${modelNamesToUse[i]}`;
                let files = fs.readdirSync(modelPath);
                for (const j in files) {
                    if (files[j].endsWith(".json")) {
                        let jsonPath = `${modelPath}/${files[j]}`;
                        let fileJson = JSON.parse(fs.readFileSync(jsonPath));
                        let imageId = files[j].replace(".json", "");
                        if (imageId in candidateJsons) {
                            candidateJsons[imageId].modelUsed.push(modelNamesToUse[i]);
                        } else {
                            let candidateImage = new CandidateImage(imageId, jsonPath.replace(".json", ".png"), jsonPath, modelNamesToUse[i], fileJson.appName);
                            candidateJsons[imageId] = candidateImage;
                        }
                    }
                }
            }
            res.send(candidateJsons);

        } else {
            res.send("Illegal data and model name!")
        }
    });
});

//Get a candidate image based on path
router.get('/get-image', function (req, res, next) {
    let dataName = req.query.dataName;
    let modelName = req.query.modelName;
    let imageId = req.query.imageId;
    getDatasetNames(datasetPath, function (datasetNames) {
        if (datasetNames.includes(dataName) && (availableModels.includes(modelName) || modelName === "union") && (!imageId.includes("."))) {
            let imagePath = `${datasetPath}/${dataName}/${modelName}/${imageId}.png`;
            fs.readFile(imagePath, function (err, data) {
                if (data !== undefined) {
                    res.setHeader('content-type', 'image/png');
                    res.setHeader('content-disposition', 'inline');
                    res.send(data);
                } else {
                    res.send("Can't find the dataset");
                }
            });
        }
    });
});

class CandidateImage {
    constructor(imageId, imagePath, jsonPath, modelUsed, appName) {
        this.imageId = imageId;
        this.imagePath = imagePath;
        this.jsonPath = jsonPath;
        this.modelUsed = [modelUsed];
        this.appName = appName;
    }
}

module.exports = router;