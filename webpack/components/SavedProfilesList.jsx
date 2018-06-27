import React, { Component } from 'react';
import SavedProfile from '../components/SavedProfile.jsx';

class SavedProfilesList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      list: this.props.list // TODO This is an anti-pattern - but is OK as do not currently use state, only props
    };
  }

  componentDidMount(){
    $('.modal').modal(); // TODO Use js, not jquery
  }

  renderBlankState() {
    if(this.props.list.length > 0) {
      return <div></div>;
    } else {
      return (
        <div id="saved-blank-state" className="row">
          <div className="col l4 offset-l4 center-align">
            <img
              className="responsive-img"
              src="/profiles/assets/img/illustration-save.png" // TODO How to leverage jekyll for a relative path?
              alt="Save illustration"
            />
            <p>
              Save profiles to this list by clicking the <i className="material-icons blue-grey-text">star</i> button on any profile
            </p>
          </div>
        </div>
      );
    }
  }

  renderList() {
    if(this.props.list.length > 0) {
      return (
        <div>
          <ul className="collection">
            {this.props.list.map(item => (
              <SavedProfile key={item.ein} item={ item }/>
            ))}                    
          </ul>
          <div className="row">
            <div className="col s12"> {/* on full page, use l8 offset-l2 */}
              <p>
                Data is saved in this browser only<br />
                <span className="small text-muted-max">
                  So don't clear your browser data!
                </span>
              </p>
            </div>
          </div>
        </div>
      ) 
    } else {
      return <div></div>;
    }
  }

  render() {
    return (
      <div id="modal-saved-profiles" className="modal">
        <div className="modal-content">
          <div className="saved-profiles">
            <div> {/* on full page, use container-custom */}
              <div className="row">
                <div className="col s12"> {/* on full page, use l8 offset-l2 */}
                  <h5>Saved Profiles</h5>
                </div>
              </div>
              <div className="row">
                <div className="col s12">
                  { this.renderBlankState() }
                  { this.renderList() }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
export default SavedProfilesList;
