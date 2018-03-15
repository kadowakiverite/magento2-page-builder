/*eslint-disable */
define(["underscore", "../stage/previews", "../stage/structural/abstract"], function (_underscore, _previews, _abstract) {
  function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

  function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

  var Block =
  /*#__PURE__*/
  function (_Structural) {
    _inheritsLoose(Block, _Structural);

    /**
     * Block constructor
     *
     * @param {EditableArea} parent
     * @param {Stage} stage
     * @param {ConfigContentBlock} config
     * @param formData
     */
    function Block(parent, stage, config, formData, elementConverterPool, converterPool) {
      var _this;

      _this = _Structural.call(this, parent, stage, config, elementConverterPool, converterPool) || this;
      _this.title = void 0;
      _this.editOnInsert = true;
      _this.preview = void 0;
      _this.childEntityKeys = [];
      _this.preview = (0, _previews)(_this, config);
      var defaults = {};

      if (config.fields) {
        _underscore.each(config.fields, function (field, key) {
          defaults[key] = field.default;
        });
      }

      _this.stage.store.update(_this.id, _underscore.extend(defaults, formData));

      return _this;
    }
    /**
     * Retrieve the preview template
     *
     * @returns {string}
     */


    _createClass(Block, [{
      key: "previewTemplate",
      get: function get() {
        if (typeof this.preview.data.appearance !== "undefined") {
          var appearance = this.preview.data.appearance();

          if (typeof this.config.appearances !== "undefined" && typeof this.config.appearances[appearance] !== "undefined" && typeof this.config.appearances[appearance].preview_template !== "undefined") {
            return this.config.appearances[appearance].preview_template;
          }
        }

        if (this.config.preview_template) {
          return this.config.preview_template;
        }

        return "Magento_PageBuilder/component/block/preview/abstract.html";
      }
      /**
       * Retrieve the render template
       *
       * @returns {string}
       */

    }, {
      key: "renderTemplate",
      get: function get() {
        if (typeof this.getData().appearance !== "undefined") {
          var appearance = this.getData().appearance;

          if (typeof this.config.appearances !== "undefined" && typeof this.config.appearances[appearance] !== "undefined" && typeof this.config.appearances[appearance].render_template !== "undefined") {
            return this.config.appearances[appearance].render_template;
          }
        }

        if (this.config.render_template) {
          return this.config.render_template;
        }

        return "Magento_PageBuilder/component/block/render/abstract.html";
      }
    }]);

    return Block;
  }(_abstract);

  return Block;
});
//# sourceMappingURL=block.js.map
