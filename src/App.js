import React from 'react';
import './App.css';

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
                <ImageTask datasetPath={"./res/test_dataset"}
                           datasetLabels={["1", "2"]}
                           availableModels={["Screen2Vec", "visualOnly", "layoutOnly", "textOnly"]}
                           modelMode={'random'}
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
            datasetCount: 0
        };
        this.incrementCount = this.incrementCount.bind(this);
        this.onFinishLabeling = this.onFinishLabeling.bind(this);

        this.datasetLabels = this.props.datasetLabels;

        //shuffle the data order
        if (this.props.randomDataOrder) {
            shuffleArray(this.datasetLabels);
        }
    }

    incrementCount() {
        this.setState({
            datasetCount: this.state.datasetCount + 1
        })
    }

    onFinishLabeling() {
        this.props.setMainViewStateCallback("end");
    }

    render() {
        //get the dataLabel corresponding to the current datasetCount
        let dataLabel = this.datasetLabels[this.state.datasetCount];

        //get a random label
        let model = "";
        if (this.props.modelMode === "random") {
            model = this.props.availableModels[Math.floor(Math.random() * this.props.availableModels.length)];
        } else if (this.props.modelMode === "union") {
            model = "union";
        }

        //generate the paths based on the current datasetLabel and the model to use
        let srcImagePath = `${this.props.datasetPath}/${dataLabel}/src.png`;
        let srcJsonPath = `${this.props.datasetPath}/${dataLabel}/src.json`;
        let modelImagesDirPath = `${this.props.datasetPath}/${dataLabel}/${model}`;

        //TODO: generate the paths for all images


        //check if the current data is the last one
        let isLastDataSet = this.state.datasetCount === this.datasetLabels.length - 1;

        return (
            <header className="App-header">
                <SourceImage srcImagePath={srcImagePath}
                             srcJsonPath={srcJsonPath}/>
                <div style={this.props.showDebugInfo ? {display: "block"} : {display: "none"}}>
                    <ul>
                        <li>Count = {this.state.datasetCount + 1}{"\n"}</li>
                        <li>Src Image Path: {srcImagePath}{"\n"}</li>
                        <li>Src JSON Path: {srcJsonPath}{"\n"}</li>
                        <li>Dst Image Dir Path: {modelImagesDirPath}{"\n"}</li>
                        <li>Model: {model}</li>
                    </ul>
                </div>
                <MyButton
                    text={isLastDataSet ? "Finish" : "Next"}
                    buttonCallback={isLastDataSet ? this.onFinishLabeling : this.incrementCount}/>
            </header>
        );
    }
}

/**
 * class for storing a image candidate
 */
class CandidateImage {
    constructor(imageId, imagePath, modelUsed, appName) {
        this.imageId = imageId;
        this.imagePath = imagePath;
        this.modelUsed = modelUsed;
        this.appName = appName;
    }
}


class SourceImage extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id="sourceImageContainer">
                <div id="imageInstruction">
                    <h3>Source Screen</h3>
                    <ul>
                        <li>App: Test App</li>
                    </ul>
                </div>
                <div id="sourceImage">
                    <img src={this.props.srcImagePath} alt="source screenshot" height="500"/>
                </div>
            </div>
        );
    }
}

class compareImage extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id="sourceImageContainer">
                <div id="imageInstruction">
                    <h3>Source Screen</h3>
                    <ul>
                        <li>App: Test App</li>
                    </ul>
                </div>
                <div id="sourceImage">
                    <img src={this.props.imagePath} alt="image screenshot" height="500"/>
                </div>
            </div>
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


export default App;
