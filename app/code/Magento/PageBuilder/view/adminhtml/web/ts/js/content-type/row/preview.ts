/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

import "jarallax";
import "jarallaxVideo";
import Player from "vimeo";
import $ from "jquery";
import ko from "knockout";
import events from "Magento_PageBuilder/js/events";
import ResizeObserver from "Magento_PageBuilder/js/resource/resize-observer/ResizeObserver";
import _ from "underscore";
import ContentTypeConfigInterface from "../../content-type-config.types";
import ConditionalRemoveOption from "../../content-type-menu/conditional-remove-option";
import HideShowOption from "../../content-type-menu/hide-show-option";
import {OptionsInterface} from "../../content-type-menu/option.types";
import ContentTypeInterface from "../../content-type.types";
import {ContentTypeMountEventParamsInterface, ContentTypeReadyEventParamsInterface} from "../content-type-events.types";
import ObservableUpdater from "../observable-updater";
import PreviewCollection from "../preview-collection";

declare global {
    interface Window { Vimeo: any; }
}

/**
 * @api
 */
export default class Preview extends PreviewCollection {
    public getChildren: KnockoutComputed<{}>;
    public wrapClass: KnockoutObservable<boolean> = ko.observable(false);
    private element: Element;

    /**
     * Debounce and defer the init of Jarallax
     *
     * @type {(() => void) & _.Cancelable}
     */
    private buildJarallax = _.debounce(() => {
        // Destroy all instances of the plugin prior
        try {
            // store/apply correct style after destroying, as jarallax incorrectly overrides it with stale value
            const style = this.element.getAttribute("data-jarallax-original-styles") ||
                this.element.getAttribute("style");
            jarallax(this.element, "destroy");
            this.element.setAttribute("style", style);
        } catch (e) {
            // Failure of destroying is acceptable
        }
        if (this.element &&
            $(this.element).hasClass("jarallax") &&
            (this.contentType.dataStore.get("background_type") as string) !== 'video' &&
            (this.contentType.dataStore.get("background_image") as any[]).length
        ) {
            _.defer(() => {
                // Build Parallax on elements with the correct class
                const parallaxSpeed = Number.parseFloat(this.contentType.dataStore.get("parallax_speed") as string);
                jarallax(
                    this.element,
                    {
                        imgPosition: this.contentType.dataStore.get("background_position") as string || "50% 50%",
                        imgRepeat: (
                            (this
                                .contentType
                                .dataStore
                                .get("background_repeat") as "repeat" | "no-repeat") || "no-repeat"
                        ),
                        imgSize: this.contentType.dataStore.get("background_size") as string || "cover",
                        speed: !isNaN(parallaxSpeed) ? parallaxSpeed : 0.5,
                    },
                );

                jarallax(this.element, "onResize");
            });
        }

        if (this.element &&
            (this.contentType.dataStore.get("background_type") as string) === 'video' &&
            (this.contentType.dataStore.get("video_source") as any[]).length
        ) {
            window.Vimeo = window.Vimeo || {"Player": Player};
            const parallaxSpeed = (this.contentType.dataStore.get("enable_parallax") as string) === "1"
                ? Number.parseFloat(this.contentType.dataStore.get("parallax_speed") as string)
                : 1;

            _.defer(() => {
                // Build Parallax on elements with the correct class
                jarallax(
                    this.element,
                    {
                        videoSrc: this.contentType.dataStore.get("video_source") as string,
                        videoLoop: (this.contentType.dataStore.get("video_loop") as string) === "true",
                        speed: !isNaN(parallaxSpeed) ? parallaxSpeed : 0.5,
                        videoPlayOnlyVisible: (this.contentType.dataStore.get("video_play_only_visible") as string) === "true",
                        videoLazyLoading: (this.contentType.dataStore.get("video_lazy_load") as string) === "true"
                    },
                );
            });
        }

    }, 50);

    /**
     * @param {ContentTypeInterface} contentType
     * @param {ContentTypeConfigInterface} config
     * @param {ObservableUpdater} observableUpdater
     */
    constructor(
        contentType: ContentTypeInterface,
        config: ContentTypeConfigInterface,
        observableUpdater: ObservableUpdater,
    ) {
        super(contentType, config, observableUpdater);

        this.contentType.dataStore.subscribe(this.buildJarallax);
        events.on("row:mountAfter", (args: ContentTypeReadyEventParamsInterface) => {
            if (args.id === this.contentType.id) {
                this.buildJarallax();
            }
        });
        events.on("contentType:mountAfter", (args: ContentTypeMountEventParamsInterface) => {
            if (args.contentType.parentContentType && args.contentType.parentContentType.id === this.contentType.id) {
                this.buildJarallax();
            }
        });
        events.on(`stage:${this.contentType.stageId}:fullScreenModeChangeAfter`, () => {
            _.delay(() => {
                this.buildJarallax();
            }, 350);
        });
    }

    /**
     * Use the conditional remove to disable the option when the content type has a single child
     *
     * @returns {OptionsInterface}
     */
    public retrieveOptions(): OptionsInterface {
        const options = super.retrieveOptions();

        options.remove = new ConditionalRemoveOption({
            ...options.remove.config,
            preview: this,
        });

        options.hideShow = new HideShowOption({
            preview: this,
            icon: HideShowOption.showIcon,
            title: HideShowOption.showText,
            action: this.onOptionVisibilityToggle,
            classes: ["hide-show-content-type"],
            sort: 40,
        });

        return options;
    }

    /**
     * Init the parallax element
     *
     * @param {Element} element
     */
    public initParallax(element: Element) {
        this.element = element;
        _.defer(() => {
            this.buildJarallax();
        });

        new ResizeObserver(() => {
            // Observe for resizes of the element and force jarallax to display correctly
            if ($(this.element).hasClass("jarallax") &&
                (this.contentType.dataStore.get("background_image") as any[]).length
            ) {
                jarallax(this.element, "onResize");
                jarallax(this.element, "onScroll");
            }
        }).observe(this.element);
    }

    /**
     * Destroy jarallax instance.
     */
    public destroy(): void {
        super.destroy();

        if (this.element) {
            jarallax(this.element, "destroy");
        }
    }
}
