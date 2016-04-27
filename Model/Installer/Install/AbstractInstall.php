<?php

namespace Gene\BlueFoot\Model\Installer\Install;

use Gene\BlueFoot\Api\ContentBlockRepositoryInterface;
use Gene\BlueFoot\Setup\EntitySetupFactory;

/**
 * Class Attribute
 *
 * @package Gene\BlueFoot\Model\Installer
 *
 * @author Dave Macaulay <dave@gene.co.uk>
 */
class AbstractInstall extends \Magento\Framework\Model\AbstractModel
{
    /**
     * @var \Gene\BlueFoot\Setup\EntitySetupFactory
     */
    protected $_entitySetupFactory;

    /**
     * @var bool
     */
    protected $_eavSetup = false;

    /**
     * @var \Magento\Eav\Model\Entity\Type
     */
    protected $_entityType;

    /**
     * @var \Magento\Framework\Filesystem\Io\File
     */
    protected $_ioFile;

    /**
     * @var \Magento\Framework\Module\Dir\Reader
     */
    protected $_moduleReader;

    /**
     * @var \Gene\BlueFoot\Api\ContentBlockRepositoryInterface
     */
    protected $_contentBlockRepository;

    /**
     * @var array
     */
    protected $_classMapping = [];

    /**
     * @var null|array
     */
    protected $_installData = null;

    /**
     * @var \Gene\BlueFoot\Model\ResourceModel\Entity
     */
    protected $_entity;

    /**
     * Attribute constructor.
     *
     * @param \Magento\Framework\Model\Context                             $context
     * @param \Magento\Framework\Registry                                  $registry
     * @param \Gene\BlueFoot\Setup\EntitySetupFactory                      $entitySetupFactory
     * @param \Magento\Framework\Model\ResourceModel\AbstractResource|null $resource
     * @param \Magento\Framework\Data\Collection\AbstractDb|null           $resourceCollection
     * @param array                                                        $data
     */
    public function __construct(
        \Magento\Framework\Model\Context $context,
        \Magento\Framework\Registry $registry,
        EntitySetupFactory $entitySetupFactory,
        \Gene\BlueFoot\Model\ResourceModel\Entity $entity,
        \Magento\Framework\Filesystem\Io\File $ioFile,
        \Magento\Framework\Module\Dir\Reader $moduleReader,
        ContentBlockRepositoryInterface $contentBlockRepositoryInterface,
        \Magento\Framework\Model\ResourceModel\AbstractResource $resource = null,
        \Magento\Framework\Data\Collection\AbstractDb $resourceCollection = null,
        array $data = []
    ) {
        parent::__construct($context, $registry, $resource, $resourceCollection, $data);

        $this->_entitySetupFactory = $entitySetupFactory;
        $this->_ioFile = $ioFile;
        $this->_moduleReader = $moduleReader;
        $this->_contentBlockRepository = $contentBlockRepositoryInterface;

        $this->_eavSetup = $this->_entitySetupFactory->create();
        $this->_entity = $entity;

        // Declare the model fields that require to be mapped
        $this->_modelFields = ['backend_model', 'frontend_model', 'source_model', 'data_model'];

        $this->_loadClassMapping();
    }

    /**
     * Set the install data on the model
     *
     * @param $data
     */
    public function setInstallData($data)
    {
        $this->_installData = $data;
    }

    /**
     * Get the entity type ID
     *
     * @return mixed
     */
    public function getEntityTypeId()
    {
        return $this->_entity->getEntityType()->getEntityTypeId();
    }

    /**
     * Determine whether an attribute already exists
     *
     * @param $attributeCode
     *
     * @return mixed
     */
    protected function _attributeExists($attributeCode)
    {
        return $this->_eavSetup->getAttribute($this->getEntityTypeId(), $attributeCode, 'attribute_code');
    }

    /**
     * Determine whether an attribute exists, or will exist by the time the installation has finished
     *
     * @param $attributeCode
     *
     * @return bool
     */
    protected function _attributeWillExist($attributeCode)
    {
        // Check to see if the attribute already exists?
        if ($this->_attributeExists($attributeCode)) {
            return true;
        }

        // Check to see if the attribute will exist after the installation is finished
        if (isset($this->_installData) && isset($this->_installData['attributes'])) {
            if ($this->_findEntityByKey($this->_installData['attributes'], 'attribute_code', $attributeCode)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Determine if a content block exists
     *
     * @param $identifier
     *
     * @return bool
     */
    protected function _contentBlockExists($identifier)
    {
        try {
            $contentBlock = $this->_contentBlockRepository->getByIdentifier($identifier);
            if ($contentBlock->getId()) {
                return true;
            }
        } catch (\Exception $e) {
            return false;
        }

        return false;
    }

    /**
     * Will a content block exist after installation has completed?
     *
     * @param $identifier
     *
     * @return bool
     */
    protected function _contentBlockWillExist($identifier)
    {
        if ($this->_contentBlockExists($identifier)) {
            return true;
        }

        if (isset($this->_installData) && isset($this->_installData['content_blocks'])) {
            if ($this->_findEntityByKey($this->_installData['content_blocks'], 'identifier', $identifier)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Find a row in data via a key and value
     *
     * @param $data
     * @param $key
     * @param $value
     *
     * @return bool
     */
    protected function _findEntityByKey($data, $key, $value)
    {
        // Check if the attribute data has been set
        if (empty($data)) {
            return false;
        }

        foreach ($data as $attribute) {
            if (isset($attribute[$key]) && $attribute[$key] == $value) {
                return $attribute;
            }
        }

        return false;
    }

    /**
     * Load in the class mappings from various json strings
     *
     * @throws \Exception
     * @throws \Zend_Json_Exception
     */
    protected function _loadClassMapping()
    {
        // Declare the directory to the class mapping directory
        $directory = $this->_moduleReader->getModuleDir(false, 'Gene_BlueFoot') . DIRECTORY_SEPARATOR . 'Setup' . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'class_mapping';
        $this->_ioFile->setAllowCreateFolders(false);

        // Open the directory and list all files
        $this->_ioFile->open(['path' => $directory]);
        $mappingFiles = $this->_ioFile->ls();

        // If class mapping files are present combine them
        if (is_array($mappingFiles) && !empty($mappingFiles)) {
            foreach ($mappingFiles as $mappingFile) {

                // Only load in json files
                if (isset($mappingFile['filetype']) && $mappingFile['filetype'] == 'json') {
                    $fileContents = $this->_ioFile->read($mappingFile['text']);
                    if ($fileContents) {
                        $fileJson = \Zend_Json::decode($fileContents);
                        if (is_array($fileJson)) {

                            // Combine the mappings into one beautiful string
                            $this->_classMapping = array_merge($this->_classMapping, $fileJson);
                        }
                    }
                }
            }
        }
    }

    /**
     * Map classes from Magento 1 to Magento 2
     *
     * See the Setup/data/class_mapping/*.json files for the mappings used here
     *
     * @param $data
     */
    protected function _mapClasses(&$data)
    {
        foreach ($this->_modelFields as $field) {
            if (isset($data[$field]) && isset($this->_classMapping[$data[$field]])) {
                $data[$field] = $this->_classMapping[$data[$field]];
            }
        }

        return $data;
    }

}