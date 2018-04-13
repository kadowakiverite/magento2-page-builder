/*eslint-disable */
define(["Magento_PageBuilder/js/component/loader", "Magento_PageBuilder/js/preview-converter-resolver", "Magento_PageBuilder/js/component/block/observable-updater-factory"], function (_loader, _previewConverterResolver, _observableUpdaterFactory) {
  /**
   * Copyright © Magento, Inc. All rights reserved.
   * See COPYING.txt for license details.
   */

  /**
   * Create new preview instance
   *
   * @param {ContentTypeInterface} contentType
   * @param {ContentTypeConfigInterface} config
   * @returns {Promise<ContentTypeInterface>}
   */
  function create(contentType, config) {
    return new Promise(function (resolve) {
      (0, _observableUpdaterFactory)(config, _previewConverterResolver).then(function (observableUpdater) {
        (0, _loader)([config.preview_component], function (ContentComponent) {
          resolve(new ContentComponent(contentType, config, observableUpdater));
        });
      }).catch(function (error) {
        console.error(error);
      });
    });
  }

  return create;
});
//# sourceMappingURL=preview-factory.js.map
