import React, { useEffect, useState } from 'react';
import {
  Alert,
  Content,
  Form,
  FormGroup,
  FormHelperText,
  FormSection,
  Grid,
  GridItem,
  HelperText,
  HelperTextItem,
  InputGroup,
  InputGroupItem,
  Radio,
  Switch,
  TextInput,
} from '@patternfly/react-core';
import {
  EvictionType,
  MaxSizeUnit,
  TimeUnits,
} from '@services/infinispanRefData';
import { useTranslation } from 'react-i18next';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { SelectSingle } from '@app/Common/SelectSingle';
import { selectOptionProps } from '@utils/selectOptionPropsCreator';
import { useApiAlert } from '@utils/useApiAlert';
import { useParams } from 'react-router-dom';
import { useFetchEditableConfiguration } from '@app/services/configHook';
import { TabsToolbar } from '@app/Caches/Configuration/Features/TabsToolbar';
import { convertToMaxSizeUnit, convertToSizeAndUnit } from '@utils/convertToSizeAndUnit';
import { ConsoleServices } from '@services/ConsoleServices';
import { validateNumber } from '@utils/validateInputNumber';
import {
  CONF_MUTABLE_ADVANCED_JMX_STATISTICS,
  CONF_MUTABLE_MEMORY_MAX_COUNT,
  CONF_MUTABLE_MEMORY_MAX_SIZE,
  CONF_MUTABLE_TRACING_CATEGORIES,
  CONF_MUTABLE_TRACING_ENABLED,
} from '@services/cacheConfigUtils';
import { PopoverHelp } from '@app/Common/PopoverHelp';
import TimeQuantityInputGroup from '@app/Caches/Create/TimeQuantityInputGroup';
import { convertFromTimeQuantity } from '@utils/convertToTimeQuantity';

const AdvancedPropertiesConfigurator = () => {
  const { t } = useTranslation();
  const brandname = t('brandname.brandname');
  const { addAlert } = useApiAlert();
  const cacheName = useParams()['cacheName'] as string;
  const { loadingConfig, errorConfig, editableConfig } = useFetchEditableConfiguration(cacheName);
  const [error, setError] = useState<string>('');
  const [jmxEnabled, setJmxEnabled] = useState(false);
  const [lockTimeoutNumber, setLockTimeoutNumber] = useState(-1);
  const [lockTimeoutUnit, setLockTimeoutUnit] = useState(TimeUnits.milliseconds);


  useEffect(() => {
    if (!loadingConfig && errorConfig.length == 0 && editableConfig) {
      setActualValues();
    }
  }, [loadingConfig, errorConfig, editableConfig]);

  const updateAdvanced = () => {
    ConsoleServices.caches()
      .setConfigAttribute(cacheName, CONF_MUTABLE_ADVANCED_JMX_STATISTICS, jmxEnabled + '')
      .then((actionResponse) => {
        addAlert(actionResponse);
      });
  };

  const setActualValues = () => {
    if (!editableConfig) {
      return;
    }
    const lockTimeout = convertFromTimeQuantity(editableConfig.lockTimeout);
    setLockTimeoutNumber(lockTimeout[0]);
    setLockTimeoutUnit(lockTimeout[1]);
    setJmxEnabled(editableConfig.jmxEnabled);
  };

  const enableJmxStatistics = () => {
    return (
      <FormGroup fieldId="form-jmx">
        <Switch
          aria-label="jmx"
          data-cy="jmxSwitch"
          id="jmx"
          isChecked={jmxEnabled}
          onChange={() => {
            setJmxEnabled(!jmxEnabled);
          }}
          hasCheckIcon
          label={jmxEnabled ? t('caches.advanced.jmx-enabled') : t('caches.advanced.jmx-disabled')}
        />
        <PopoverHelp name={'jmx'} label={t('caches.advanced.jmx.title')} content={t('caches.advanced.jmx-tooltip')} />
      </FormGroup>
    );
  };

  const lockTimeout = () => {
    return (
      <FormGroup
        fieldId="form-life-span"
        label={t('caches.edit-configuration.lifespan')}
        labelHelp={
          <PopoverHelp
            name={'lifespan'}
            label={t('caches.edit-configuration.lifespan')}
            content={t('caches.edit-configuration.lifespan-tooltip')}
          />
        }
      >
        <TimeQuantityInputGroup
          name={'lifespan'}
          validate={validateLifeSpan}
          minValue={-1}
          value={lifeSpanNumber}
          valueModifier={setLifeSpanNumber}
          unit={lifeSpanUnit}
          unitModifier={setLifeSpanUnit}
          disabled={!isExpiration}
        />
        {validateLifeSpan() === 'error' && (
          <FormHelperText>
            <HelperText>
              <HelperTextItem variant={'error'} icon={<ExclamationCircleIcon />}>
                {t('caches.edit-configuration.lifespan-helper-invalid')}
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        )}
      </FormGroup>
    )
  }

  const displayError = () => {
    if (error.length == 0) {
      return <></>;
    }

    return (
      <GridItem span={12}>
        <Alert variant="danger" isInline title={t(`caches.edit-configuration.${error}`)} />
      </GridItem>
    );
  };

  return (
    <Form title={t('caches.advanced.advanced-title')}>
      <FormSection title={t('caches.edit-configuration.advanced-title')}>
        {enableJmxStatistics()}
        {<TabsToolbar id="tracing" saveAction={updateAdvanced} />}
      </FormSection>
    </Form>
  );
};

export default AdvancedPropertiesConfigurator;
