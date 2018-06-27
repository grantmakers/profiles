import React, { Component } from 'react';
import { render } from 'react-dom';
import ActionBar from './components/ActionBar.jsx';
import SavedProfilesList from './components/SavedProfilesList.jsx';

const orgData = {};
const orgDataTarget = document.getElementById('org-data');
const listFromLocalStorage = JSON.parse(localStorage.getItem('profiles')) || [];

function getCurrentOrgData(orgDataTarget) {
  orgData.ein = orgDataTarget.dataset.ein;
  orgData.name = orgDataTarget.dataset.name;
  orgData.tax_year = orgDataTarget.dataset.taxYear;
  orgData.url = orgDataTarget.dataset.url;
  return orgData;
}

getCurrentOrgData(orgDataTarget);

class Profiles extends Component {
  constructor() {
    super();
    this.communicateListChange = this.communicateListChange.bind(this);
    this.state = {
      list: listFromLocalStorage
    };
  }

  communicateListChange(list) {
    this.setState({
      list: list
    })
  }

  render() {
    return (
      <div>
        <ActionBar 
          data={ orgData } 
          list={ this.state.list } 
          communicateListCB={ this.communicateListChange } 
        />
        <SavedProfilesList 
          list={ this.state.list } 
          communicateListCB={ this.communicateListChange }
        />
      </div>
    )
  }
}

render(<Profiles />, document.getElementById('root'));
