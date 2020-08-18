import React from 'react';

const { remote, ipcRenderer } = require('electron');
const { dialog } = remote;

class App extends React.Component {
  constructor(props: any) {
    super(props);
    // this.handleFileClick = this.handleFileClick.bind(this);
  }

  // handleFileClick() {
  //   const options = {
  //     filters: [
  //       { name: 'Images', extensions: ['png'] },
  //       { name: 'Custom File Type', extensions: ['as'] },
  //     ]
  //   }

  //   dialog.showOpenDialog({
  //     properties: ['openFile', 'multiSelections']
  //   }, function (files) {
  //     if (files !== undefined) {
  //       // handle files
  //       console.log('file path undefined');
  //     }
  //   })
  //     .then(result => {
  //       console.log('result', result);
  //     })
  //     .catch(err => {
  //       console.log(err);
  //     })
  // };

  sendDBRequest = () => {
    ipcRenderer.send('dbRequest', 'yo');
  }



  render() {
    return (
      <div>
        <h1 style={{ color: 'black' }}>SeeQR</h1>
        <h2>Mercer Version</h2>
        <textarea></textarea>
        <button onClick={this.sendDBRequest}>Submit</button>
        <button>Spin up Database</button>


        {/* <h3 style={{ "color": "black" }}>Welcome!</h3>
        <h3 style={{ "color": "black" }}>Import database?</h3>
        <button>Skip</button>
        <button onClick={this.handleFileClick}>Yes</button> */}
      </div>
    );
  }
}

export default App;
