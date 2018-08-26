import React from 'react'
import Context from './Context'
import PropTypes from 'prop-types'

export default class SubProvider extends Component {

  constructor(props) {
    super(props)
    this.getValue = this.makeCache()
    this.renderProvider = this.renderProvider.bind(this)
  }

  makeCache() {
    let last
    return (value) => {
      if (last) {
        const thisState = this.props.selector(value.state)
        if (Object.keys(last).some(key => thisState[key] !== last[key])) {
          last = thisState
          return { ...value, state: last }
        }
        return last
      }
      last = this.props.selector(value.state)
      return { ...value, state: last }
    }
  }

  renderProvider(value) {
    return (
      <Context.Provider value={this.getValue(value)}>
        {this.props.children}
      </Context.Provider>
    )
  }

  render() {
    return (
      <Context.Consumer>
        {this.renderProvider}
      </Context.Consumer>
    )
  }
}

SubProvider.propTypes = {
  children: PropTypes.any,
  selector: PropTypes.func.isRequired
}
