import React, { Component } from 'react';
import Clipboard from 'react-clipboard.js';
import { buildProfileMailto, handleCopyClick } from '../helpers.js'

class ActionBar extends Component {
  constructor(props) {
    super(props);
    this.handleSaveClick = this.handleSaveClick.bind(this);
    this.addProfile = this.addProfile.bind(this, this.props.data);
    this.removeProfile = this.removeProfile.bind(this, this.props.data);
    this.state = {
      save: true,
    };
  }

  // Toggle between saving and unsaving
  handleSaveClick() {
    const state = this.state.save;
    state ? this.addProfile() : this.removeProfile();    
    this.setState({
      save: !this.state.save
    });
  }

  addProfile(data) {
    let arr = JSON.parse(localStorage.getItem('profiles'));
    if (!Array.isArray(arr) || !arr.length) {
      arr = [];
    }
    data.saved_on = new Date().toISOString();
    arr.unshift(data);
    localStorage.setItem('profiles', JSON.stringify(arr));
    this.props.communicateListCB(arr);
  }

  removeProfile(data) {
    let ein = data.ein;
    let arr = JSON.parse(localStorage.getItem('profiles'));
    const after = arr.filter(function(a) { return a.ein !== ein;});
    localStorage.setItem('profiles', JSON.stringify(after));
    this.props.communicateListCB(after);
  }

  // TODO ComponentWillMount is now deprecated
  componentWillMount() {
    // Check if current page ein exists in localstorage and set state
    const list = this.props.list;
    const data = this.props.data;
    if (list) {
      for (let i = 0; i < list.length; i++) {
        if (list[i].ein === data.ein) {
          this.setState({
            save: false
          })
        }
      }
    }
  }

  render() {
    return (
      <div className="left-action-bar hide-on-med-and-down">
        <ul className="z-depth-3">
          <li>
            <a
              className="tooltipped"
              onClick={ this.handleSaveClick }
              data-tooltip={ this.state.save ? 'Save this profile' : 'Unsave this profile' }
              data-position="right"
              data-ga={ this.state.save ? 'Save profile via Left Action Bar' : 'Unsave profile via Left Action Bar' }
            >
              <i className="material-icons">{this.state.save ? 'star_outline' : 'star'}</i>
              <span>{this.state.save ? 'SAVE' : 'SAVED'}</span>
            </a>
          </li>
          <li>
            <a
              href={ buildProfileMailto(this.props.data) }
              target="_blank"
              className="tooltipped"
              data-tooltip="Share this profile via email"
              data-position="right"
              data-ga="Share Profile via Left Action Bar"
            >
              <i className="material-icons">email</i>
              <span>Share</span>
            </a>
          </li>
          <li>
            <Clipboard 
              component="a"
              className="tooltipped"
              data-clipboard-text={ this.props.data.url }
              data-js="copy"
              data-tooltip="Copy link to clipboard"
              data-position="right"
              data-ga="Copy Link via Left Action Bar"
              // onSuccess={ () => handleCopyClick(this.props.data.url) }
              onSuccess={ handleCopyClick }
            >
              <div>
                <i className="material-icons">link</i>
                <span>Copy link</span>
              </div>
            </Clipboard>
          </li>
        </ul>
      </div>
    )
  }
}
export default ActionBar;