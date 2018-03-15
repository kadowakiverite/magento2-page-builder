/*eslint-disable */
define([], function () {
  /**
   * Copyright © Magento, Inc. All rights reserved.
   * See COPYING.txt for license details.
   */
  var Target =
  /*#__PURE__*/
  function () {
    function Target() {}

    var _proto = Target.prototype;

    _proto.fromDom = function fromDom(value, key, data) {
      return value === "_blank" ? "1" : "0";
    };

    _proto.toDom = function toDom(value, key, data) {
      return value === "1" ? "_blank" : null;
    };

    return Target;
  }();

  return Target;
});
//# sourceMappingURL=target.js.map
