import * as _ from 'underscore';
import { StageInterface } from '../stage.d';
import EventEmitter from '../event-emitter';
import Config from '../config';
import createBlock from '../block/factory';
import { EditableAreaInterface } from './structural/editable-area.d';
import { RowInterface } from './structural/row.d';
import { ColumnInterface } from './structural/column.d';
import Block from '../block/block';
import AttributeReaderComposite from '../format/read/composite';

/**
 * Build Class
 *
 * @author Dave Macaulay <hello@davemacaulay.com>
 */
export default class Build extends EventEmitter {
    stage: StageInterface;
    document: Element;
    attributeReaderComposite: AttributeReaderComposite;

    /**
     */
    constructor() {
        super();
        this.attributeReaderComposite = new AttributeReaderComposite();
    }

    /**
     * Parse the potential structure
     *
     * @param structure
     */
    parseStructure(structure: string) {
        if (!structure) {
            return false;
        }
        this.document = document.createElement('div');
        this.document.innerHTML = '<div data-role="stage">' + structure + '</div>';
        return this.document.querySelector('[' + Config.getValue('dataRoleAttributeName') + '="stage"]');
    }

    /**
     * Build the stage
     *
     * @param stage
     * @param stageElement
     * @returns {Build}
     */
    buildStage(stage: StageInterface, stageElement: HTMLElement) {
        this.stage = stage;
        this.parseAndBuildStage(stageElement);
        return this;
    }

    /**
     * Parse and build the stage from the stage element
     *
     * @param stageElement
     * @returns {Promise<T>}
     */
    parseAndBuildStage(stageElement: HTMLElement) {
        return this.parseAndBuildElement(stageElement, this.stage)
            .then(() => {
                this.emit('buildDone');
            }).catch((error: string) => {
                this.emit('buildError', error);
            });
    }

    /**
     * Parse an element in the structure and build the required element
     *
     * @param element
     * @param parent
     * @returns {Promise<EditableAreaInterface>}
     */
    parseAndBuildElement(element: HTMLElement, parent: EditableAreaInterface): Promise<EditableAreaInterface> {
        if (element instanceof HTMLElement &&
            element.getAttribute(Config.getValueAsString('dataRoleAttributeName'))
        ) {
            parent = parent || this.stage;
            let self = this,
                role = element.getAttribute(Config.getValue('dataRoleAttributeName'));


            let getElementDataPromise = new Promise(function (resolve, error) {
                resolve(self.getElementData(element))
            }.bind(this));

            return getElementDataPromise.then(function (data) {
                let children = this.getElementChildren(element);
                // Add element to stage
                return this.buildElement(role, data, parent).then(function (newParent) {
                    if (children.length > 0) {
                        let childPromises = [];
                        _.forEach(children, function (child) {
                            childPromises.push(self.parseAndBuildElement(child, newParent));
                        });
                        return Promise.all(childPromises);
                    } else {
                        return Promise.resolve(newParent);
                    }
                });
            }.bind(this));
        } else {
            return Promise.reject(new Error('Element does not contain valid role attribute.'));
        }
    }

    /**
     * Retrieve the elements data
     *
     * @param element
     * @returns {{}}
     */
    getElementData(element: HTMLElement) {
        let result = {};
        const readPromise = this.attributeReaderComposite.read(element);
        return readPromise.then(function (data) {
            return result ? _.extend(result, data) : {}
        });
    }

    /**
     * Return elements children, search for direct decedents, or traverse through to find deeper children
     *
     * @param element
     * @returns {Array}
     */
    getElementChildren(element: HTMLElement) {
        if (element.hasChildNodes()) {
            let children: Array<any> = [];
            // Find direct children of the element
            _.forEach(element.childNodes, (child: HTMLElement) => {
                // Only search elements which tagName's and not script tags
                if (child.tagName && child.tagName != 'SCRIPT') {
                    if (child.hasAttribute(Config.getValueAsString('dataRoleAttributeName'))) {
                        children.push(child);
                    } else {
                        children = this.getElementChildren(child);
                    }
                }
            });

            if (children.length > 0) {
                return children;
            }
        }

        return [];
    }

    /**
     * Forward build instruction to necessary build function
     *
     * @param role
     * @param data
     * @param parent
     * @returns {Promise<EditableAreaInterface>}
     */
    buildElement(role: string, data: object, parent: any): Promise<EditableAreaInterface> {
        switch (role) {
            case 'stage':
                // If the stage is being built, we don't need to "build" anything, just return the stage as the
                // new parent
                return Promise.resolve(this.stage);
            default:
                return this.buildEntity(role, data, parent);
        }
    }

    /**
     * Build a new row with it's associated data
     *
     * @param data
     * @param parent
     * @returns {Promise<RowInterface>}
     */
    private buildRow(data: object, parent: StageInterface): Promise<RowInterface> {
        return Promise.resolve(parent.addRow(this.stage, data));
    }

    /**
     * Build a new column with it's associated data
     *
     * @param data
     * @param parent
     * @returns {Promise<ColumnInterface>}
     */
    private buildColumn(data: object, parent: RowInterface | ColumnInterface): Promise<ColumnInterface> {
        return Promise.resolve(parent.addColumn(data));
    }

    /**
     * Add an entity into the system
     *
     * @param role
     * @param data
     * @param parent
     * @returns {Promise<T>}
     */
    private buildEntity(role: string, data: object, parent: EditableAreaInterface): Promise<Block> {
        return new Promise(function (resolve, reject) {
            createBlock(
                Config.getInitConfig('contentTypes')[role],
                parent,
                this.stage,
                data
            ).then(function (block) {
                parent.addChild(block);
                resolve(block);
            }).catch(function (error) {
                reject(error);
            });
        }.bind(this));
    }
}
