import React from 'react';

let CheckboxListItem = React.createClass({
  propTypes: {
    label: React.PropTypes.string.isRequired,
    isChecked: React.PropTypes.bool,
    onChange: React.PropTypes.func
  },

  getDefaultProps: function() {
    return {
      isChecked: false
    }
  },

  render: function() {
    return (
      <div>
        <label className="checkboxList">
          <input
            ref="checkbox"
            type="checkbox"
            checked={this.props.isChecked}
            onChange={this.props.onChange}
          />
        {this.props.label}
        </label>
      </div>
    )
  }
});

let CheckboxList = React.createClass({
  propTypes: {
    items: React.PropTypes.array.isRequired,
    onChange: React.PropTypes.func
  },

  renderItem: function(item) {
    let onChange = function(event) {
      let value = event.target.checked;
      this.props.onChange(item.key, value, item.language, item.firstName, item.lastName)
    }.bind(this);

    return (
      <CheckboxListItem
        label={item.label}
        key={item.key}
        isChecked={item.isChecked}
        onChange={onChange}
      />
    );
  },

  render: function() {
    let items;
    if (this.props.items.length > 0) {
      items = this.props.items.map(this.renderItem);
    } else {
      items = (<div><label className="checkboxList">{"--"}</label></div>)
    }
    return (
      <div>
        {items}
      </div>
    )
  }
});

module.exports = CheckboxList;
