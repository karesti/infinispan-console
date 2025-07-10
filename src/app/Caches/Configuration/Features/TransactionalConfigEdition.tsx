import { useTranslation } from 'react-i18next';
import { useApiAlert } from '@utils/useApiAlert';
import { useParams } from 'react-router-dom';
import { useFetchEditableConfiguration } from '@app/services/configHook';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { TimeUnits } from '@services/infinispanRefData';
import { ConsoleServices } from '@services/ConsoleServices';
import {
  Alert,
  Form,
  FormGroup,
  FormHelperText,
  FormSection,
  Grid,
  GridItem,
  HelperText,
  HelperTextItem,
  Switch
} from '@patternfly/react-core';
import { PopoverHelp } from '@app/Common/PopoverHelp';
import TimeQuantityInputGroup from '@app/Caches/Create/TimeQuantityInputGroup';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { TabsToolbar } from '@app/Caches/Configuration/Features/TabsToolbar';
import { convertFromTimeQuantity, convertToTimeQuantity } from '@utils/convertToTimeQuantity';
import {
  CONF_MUTABLE_TRANSACTION_SINGLE_PHASE_AUTOCOMMIT,
  CONF_MUTABLE_TRANSACTION_STOP_TIMEOUT
} from '@services/cacheConfigUtils';

const TransactionalConfigEdition = () => {
  const { t } = useTranslation();
  const { addAlert } = useApiAlert();
  const cacheName = useParams()['cacheName'] as string;
  const { loadingConfig, errorConfig, editableConfig } = useFetchEditableConfiguration(cacheName);
  const [isSinglePhaseAutocommit, setIsSinglePhaseAutocommit] = useState(false);
  const [stopTimeoutNumber, setStopTimeoutNumber] = useState(-1);
  const [stopTimeoutUnit, setStopTimeoutUnit] = useState(TimeUnits.milliseconds);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loadingConfig && errorConfig.length == 0 && editableConfig) {
      setActualValues();
    }
  }, [loadingConfig, errorConfig, editableConfig]);

  const setActualValues = () => {
    if (!editableConfig) {
      return;
    }

    const parsedStopTimeout = convertFromTimeQuantity(editableConfig.transactionStopTimeout);
    setStopTimeoutNumber(parsedStopTimeout[0]);
    setStopTimeoutUnit(parsedStopTimeout[1]);
    setIsSinglePhaseAutocommit(editableConfig.transactionSinglePhaseAutocommit);
  };

  const updateTransactionalConfig = () => {
    setError('');

    const newStopTimeout = convertToTimeQuantity(stopTimeoutNumber, stopTimeoutUnit);
    if (!newStopTimeout) {
      setError('error of stop timeout');
      return;
    }

    if (newStopTimeout != editableConfig?.transactionStopTimeout) {
      ConsoleServices.caches()
        .setConfigAttribute(cacheName, CONF_MUTABLE_TRANSACTION_STOP_TIMEOUT, newStopTimeout)
        .then((actionResponse) => {
          if (actionResponse.success) {
            addAlert(actionResponse);
          } else {
            setError(actionResponse.message);
          }
        });
    }

    if (isSinglePhaseAutocommit != editableConfig?.transactionSinglePhaseAutocommit) {
      ConsoleServices.caches()
        .setConfigAttribute(cacheName, CONF_MUTABLE_TRANSACTION_SINGLE_PHASE_AUTOCOMMIT, isSinglePhaseAutocommit + '')
        .then((actionResponse) => {
          if (actionResponse.success) {
            addAlert(actionResponse);
          } else {
            setError(actionResponse.message);
          }
        });
    }
  };

  const validateStopTimeout = (): 'default' | 'error' => {
    return stopTimeoutNumber >= 0 ? 'default' : 'error';
  };

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
    <Form
      isWidthLimited
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <FormSection title={t('caches.edit-configuration.transaction-title')}>
        <FormGroup fieldId="form-single-phase-autocommit">
          <Switch
            aria-label="singlePhaseAutoCommit"
            data-cy="singlePhaseAutoCommitSwitch"
            id="singlePhaseAutoCommit"
            isChecked={isSinglePhaseAutocommit}
            onChange={() => setIsSinglePhaseAutocommit(!isSinglePhaseAutocommit)}
            hasCheckIcon
            label={
              isSinglePhaseAutocommit
                ? t('caches.edit-configuration.transaction-single-phase-autocommit-enable')
                : t('caches.edit-configuration.transaction-single-phase-autocommit-disable')
            }
          />
        </FormGroup>
        <Grid hasGutter>
          {displayError()}
          <GridItem span={4}>
            <FormGroup
              fieldId="form-stop-timeout"
              label={t('caches.edit-configuration.transaction-stop-timeout')}
              labelHelp={
                <PopoverHelp
                  name={'lifespan'}
                  label={t('caches.edit-configuration.transaction-stop-timeout')}
                  content={t('caches.edit-configuration.transaction-stop-timeout-tooltip')}
                />
              }
            >
              <TimeQuantityInputGroup
                name={'lifespan'}
                validate={validateStopTimeout}
                minValue={-1}
                value={stopTimeoutNumber}
                valueModifier={setStopTimeoutNumber}
                unit={stopTimeoutUnit}
                unitModifier={setStopTimeoutUnit}
              />
              {validateStopTimeout() === 'error' && (
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem variant={'error'} icon={<ExclamationCircleIcon />}>
                      {t('caches.edit-configuration.lifespan-helper-invalid')}
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              )}
            </FormGroup>
          </GridItem>
        </Grid>
        {<TabsToolbar id="transactional" saveAction={updateTransactionalConfig} />}
      </FormSection>
    </Form>
  );
};
export { TransactionalConfigEdition };
