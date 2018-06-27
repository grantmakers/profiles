import React, { Component } from 'react';
import Clipboard from 'react-clipboard.js';
import { buildProfileMailto, handleCopyClick } from '../helpers.js'

class SavedProfile extends Component {

  render() {
    return (
      <li className="collection-item">
        <a 
          href={ this.props.item.url } 
          className="saved-profile-link"
        >
          { this.props.item.name }
        </a>
      </li>
    )
  }
}

export default SavedProfile;
