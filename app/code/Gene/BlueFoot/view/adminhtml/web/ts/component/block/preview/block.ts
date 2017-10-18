import _, {Dictionary} from "underscore";
import ko from "knockout";
import Block from "../block";
import StyleAttributeFilter from "../../stage/style-attribute-filter";

interface PreviewData {
    [key: string]: KnockoutObservable<any>;
}

/**
 * PreviewBlock class
 *
 * @author Dave Macaulay <dmacaulay@magento.com>
 */
export default class PreviewBlock {
    template: string = '';
    parent: Block;
    config: any;
    data: PreviewData = {};
    styleAttributeFilter: StyleAttributeFilter;

    /**
     * PreviewBlock constructor
     *
     * @param {Block} parent
     * @param {Object} config
     */
    constructor(parent: Block, config: object) {
        this.parent = parent;
        this.config = config;
        this.styleAttributeFilter = new StyleAttributeFilter();

        if (typeof this.config.preview_template !== 'undefined' && this.config.preview_template) {
            this.template = this.config.preview_template;
        }

        // Subscribe to this blocks data in the store
        this.parent.stage.store.subscribe(
            (data: Dictionary<{}>) => {
                const missingFields = _.difference(this.config.fields_list, _.keys(data));
                missingFields.forEach((key) => {
                    this.updateDataValue(key, '');
                });
                _.forEach(data, (value, key) => {
                    this.updateDataValue(key, value);
                });
            },
            this.parent.id
        );
    }

    /**
     * Update the data value of a part of our internal Knockout data store
     *
     * @param {string} key
     * @param value
     */
    private updateDataValue(key: string, value: any) {
        if (typeof this.data[key] !== 'undefined' && ko.isObservable(this.data[key])) {
            this.data[key](value);
        } else {
            this.data[key] = ko.observable(value);
        }
    }

    /**
     * @returns {object}
     */
    getStyle() {
        return this.styleAttributeFilter.filter(this.data);
    }
}