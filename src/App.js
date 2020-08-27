import React from 'react';
import './App.css';

var baseUrl = "http://localhost:3001/screen2vec";

function App() {
    return (
        <div className="App">
            <h1>GUI Screen Relevance Labeling</h1>
            <RootPage/>
        </div>
    );
}

class RootPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            mainViewState: "instruction"
        };
        this.setMainViewState = this.setMainViewState.bind(this)
    }

    setMainViewState(state) {
        this.setState({
            mainViewState: state
        })
    }

    render() {
        if (this.state.mainViewState === "instruction") {
            return (
                <WorkerInstruction
                    setMainViewStateCallback={this.setMainViewState}/>
            );
        } else if (this.state.mainViewState === "task") {
            return (
                <ImageTask modelMode={'union'}
                           randomDataOrder={true}
                           showDebugInfo={true}
                           setMainViewStateCallback={this.setMainViewState}/>
            );
        } else if (this.state.mainViewState === "end") {
            return (
                <header className="App-header">
                    <h2>Thank You!</h2>
                </header>
            );
        }
    }
}

class WorkerInstruction extends React.Component {
    constructor(props) {
        super(props);
        this.startTask = this.startTask.bind(this)
    }

    startTask() {
        this.props.setMainViewStateCallback("task");
    }

    render() {
        return (
            <header className="App-header">
                <h2>Instructions</h2>
                <ol>
                    <li>Instruction Item 1</li>
                    <li>Instruction Item 2</li>
                    <li>Instruction Item 3</li>
                </ol>
                <MyButton text="Start"
                          buttonCallback={this.startTask}/>
            </header>
        );
    }
}

class MyButton extends React.Component {
    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this)
    }

    handleClick() {
        // alert(this.props.text);
        this.props.buttonCallback();
    };

    render() {
        return (
            <button className="btn-class" onClick={this.handleClick}>
                {this.props.text}
            </button>
        )
    }
}


class ImageTask extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            datasetCount: 0,
            datasetLabels: [],
            availableModels: []
        };
        this.incrementCount = this.incrementCount.bind(this);
        this.onFinishLabeling = this.onFinishLabeling.bind(this);
        this.fetchData = this.fetchData.bind(this);
        this.fetchJsonAndImage = this.fetchJsonAndImage.bind(this);
        this.randomizeModel = this.randomizeModel.bind(this);
    }

    async componentDidMount () {
        await this.fetchData();
        await this.fetchJsonAndImage();
    }

    async fetchData() {
        let datasetLabels = await getDataSetNames();
        let availableModels = await getAvailableModels();

        //shuffle the data order
        if (this.props.randomDataOrder) {
            shuffleArray(datasetLabels);
        }
        this.setState({
            datasetLabels: datasetLabels,
            availableModels: availableModels,
        });
        this.randomizeModel(availableModels);
    }

    async fetchJsonAndImage(){
        let dataLabel = this.state.datasetLabels[this.state.datasetCount];
        let srcImage = await getSrcImage(dataLabel);
        let srcJson = await getSrcJson(dataLabel);
        let candidateJson = await getCandidateJson(dataLabel, this.state.model);

        this.setState({
            srcImage: srcImage,
            srcJson: srcJson,
            candidateJson: candidateJson
        });
    }

    randomizeModel(availableModels) {
        //get a random model
        let model = "";
        if (this.props.modelMode === "random") {
            model = availableModels[Math.floor(Math.random() * availableModels.length)];
        } else if (this.props.modelMode === "union") {
            model = "union";
        }
        this.setState({
            model: model
        })
    }

    async incrementCount() {
        let newDatasetCount = this.state.datasetCount + 1;
        await this.setState({
            datasetCount: newDatasetCount
        });
        await this.randomizeModel(this.state.availableModels);
        this.fetchJsonAndImage();
    }

    onFinishLabeling() {
        this.props.setMainViewStateCallback("end");
    }

    render() {
        //get the dataLabel corresponding to the current datasetCount
        let dataLabel = this.state.datasetLabels[this.state.datasetCount];
        let model = this.state.model;

        if (dataLabel !== undefined) {
            //check if the current data is the last one
            let isLastDataSet = this.state.datasetCount === this.state.datasetLabels.length - 1;
            //generate arrays of candidates
            let candidateComponents = [];

            for (const i in this.state.candidateJson) {
                let candidateItem = this.state.candidateJson[i];
                candidateComponents.push(<CandidateImage key={"candidate" + candidateItem.imageId} candidateJson={candidateItem}/>);
            }

            //randomize the order of candidates
            shuffleArray(candidateComponents);

            return (
                <header className="App-header">
                    <SourceImage srcImage={this.state.srcImage}
                                 srcJson={this.state.srcJson}/>
                    {candidateComponents}
                    <div className="Debug-info" style={this.props.showDebugInfo ? {display: "block"} : {display: "none"}}>
                        <ul>
                            <li>Count = {this.state.datasetCount + 1}{"\n"}</li>
                            <li>Model: {model}</li>
                            <li>Candidates: {JSON.stringify(this.state.candidateJson)}</li>
                        </ul>
                    </div>
                    <MyButton
                        text={isLastDataSet ? "Finish" : "Next"}
                        buttonCallback={isLastDataSet ? this.onFinishLabeling : this.incrementCount}/>
                </header>
            );
        } else {
            return (
                <header className="App-header">
                    <p>NULL</p>
                </header>
            );
        }
    }
}


class SourceImage extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        if (this.props.srcJson !== undefined && this.props.srcImage !== undefined) {
            return (
                <div id="sourceImageContainer">
                    <div id="imageInstruction">
                        <h3>Source Screen</h3>
                        <ul>
                            <li>App Name: {this.props.srcJson.appName}</li>
                        </ul>
                    </div>
                    <div id="sourceImage">
                        <img src={this.props.srcImage} alt="source screenshot" height="500"/>
                    </div>
                </div>
            );
        } else {
            return (
                <header className="App-header">
                    <p>NULL</p>
                </header>
            );
        }
    }
}

class CandidateImage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            candidateImage: undefined
        };
        this.fetchImage = this.fetchImage.bind(this);
    }

    async componentDidMount() {
        await this.fetchImage(this.props);
    }

    async componentWillReceiveProps(nextProps, nextState, nextContext) {
        await this.fetchImage(nextProps);
    }

    async fetchImage(props) {
        const dataName = props.candidateJson.dataName;
        const modelName = props.candidateJson.modelUsed[0];
        const imageId = props.candidateJson.imageId;
        let candidateImage = await getCandidateImage(dataName, modelName, imageId);

        this.setState({
            candidateImage: candidateImage
        });

    }

    render() {
        if (this.props.candidateJson !== undefined && this.state.candidateImage !== undefined) {
            return (
                <div id="sourceImageContainer">
                    <div id="imageInstruction">
                        <h3>Candidate Screen</h3>
                        <ul>
                            <li>App Name: {this.props.candidateJson.appName}</li>
                            <li>Image ID: {this.props.candidateJson.imageId}</li>
                            <li>Model Used: {this.props.candidateJson.modelUsed.join(", ")}</li>
                        </ul>
                    </div>
                    <div id="sourceImage">
                        <img src={this.state.candidateImage} alt="candidate screenshot" height="500"/>
                    </div>
                </div>
            );
        } else return (
            <header className="App-header">
                <p>NULL</p>
            </header>
        );
    }
}


// Randomize array in-place using Durstenfeld shuffle algorithm
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

async function getDataSetNames() {
    const response = await fetch(`${baseUrl}/get-dataset-names`);
    return await response.json();
}

async function getAvailableModels() {
    const response = await fetch(`${baseUrl}/get-model-names`);
    return await response.json();
}

async function getSrcImage(dataName) {
    const response = await fetch(`${baseUrl}/get-source-image?dataName=${dataName}`);
    let blob = await response.blob();
    return URL.createObjectURL(blob);
}

async function getSrcJson(dataName) {
    const response = await fetch(`${baseUrl}/get-source-json?dataName=${dataName}`);
    return await response.json();
}

async function getCandidateJson(dataName, modelName) {
    const response = await fetch(`${baseUrl}/get-candidate-json?dataName=${dataName}&modelName=${modelName}`);
    return await response.json();
}

async function getCandidateImage(dataName, modelName, imageId) {
    const response = await fetch(`${baseUrl}/get-image?dataName=${dataName}&modelName=${modelName}&imageId=${imageId}`);
    let blob = await response.blob();
    return URL.createObjectURL(blob);
}

export default App;
