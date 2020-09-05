import React, { Component, MouseEvent, ChangeEvent } from 'react';
const { ipcRenderer } = window.require('electron');
const { dialog } = require('electron').remote;
import SchemaModal from './SchemaModal';

// Codemirror Styling
require('codemirror/lib/codemirror.css');

// Codemirror Languages
require('codemirror/mode/javascript/javascript');
require('codemirror/mode/sql/sql');

// Codemirror Themes
require('codemirror/mode/markdown/markdown');
require('codemirror/theme/monokai.css');
require('codemirror/theme/midnight.css');
require('codemirror/theme/lesser-dark.css');
require('codemirror/theme/solarized.css');

// Codemirror Component
var CodeMirror = require('react-codemirror');

/************************************************************
 *********************** TYPESCRIPT: TYPES ***********************
 ************************************************************/

type QueryProps = { currentSchema: string };

type state = {
  queryString: string;
  queryLabel: string;
  show: boolean;
};

class Query extends Component<QueryProps, state> {
  constructor(props: QueryProps) {
    super(props);
    this.handleQuerySubmit = this.handleQuerySubmit.bind(this);
    // this.handleQueryEntry = this.handleQueryEntry.bind(this);
    // this.showModal = this.showModal.bind(this);
    // this.handleQueryPrevious = this.handleQueryPrevious.bind(this);
    this.updateCode = this.updateCode.bind(this);
  }

  state: state = {
    queryString: '',
    queryLabel: '',
    show: false,
  };

  // Updates state.queryString as user inputs query label
  handleLabelEntry(event: any) {
    this.setState({ queryLabel: event.target.value });
  }

  // Updates state.queryString as user inputs query string
  updateCode(newQueryString: string) {
    this.setState({
      queryString: newQueryString,
    });
  }

  // Submits query to backend on 'execute-query' channel
  handleQuerySubmit(event: any) {
    event.preventDefault();
    // if input fields for query label or query string are empty, then
    // send alert to input both fields
    if (!this.state.queryLabel || !this.state.queryString) {
      const noInputAlert = dialog.showErrorBox('Please enter a Label and a Query.', '');
    } else {
      const queryAndSchema = {
        queryString: this.state.queryString,
        queryCurrentSchema: this.props.currentSchema,
        queryLabel: this.state.queryLabel,
      };
      ipcRenderer.send('execute-query', queryAndSchema);
      // this.setState({ queryString: '' });
    }
  }

  // handleGenerateData(event: any) {
  //   ipcRenderer.send('generate-data')
  // }

  render() {
    // Codemirror module configuration options
    var options = {
      lineNumbers: true,
      mode: 'sql',
      theme: 'lesser-dark',
    };

    return (
      <div id="query-panel">
        <h3>Query</h3>
        <form onSubmit={this.handleQuerySubmit}>
          <label>Query Label:* </label>
          <input
            className="label-field"
            type="text"
            placeholder="enter label for query"
            onChange={(e) => this.handleLabelEntry(e)}
          />
          <br />
          <br />
          <label>Query:*</label>
          {/* <input type="select" onClick={this.handleQueryPrevious}/> */}
          <div className="codemirror">
            <CodeMirror
              onChange={this.updateCode}
              options={options}
            />
          </div>
          <button>Submit</button>
          <br />
          <br />
          <p>*required</p>
        </form>
        {/* <button id="generate-data-button" onClick={this.handleGenerateData}>Generate Dummy Data</button> */}
      </div>
    );
  }
}

export default Query;
