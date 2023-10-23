import { useEffect, useState } from 'react';
import { ConsoleServices } from '@services/ConsoleServices';
import { useApiAlert } from '@utils/useApiAlert';
import { useTranslation } from 'react-i18next';

export function useFetchAvailableGroups() {
  const [agroups, setAGroups] = useState<AccessGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) {
      ConsoleServices.security()
        .getAccessGroups()
        .then((either) => {
          if (either.isRight()) {
            either.value.sort();
            setAGroups(either.value);
          } else {
            setError(either.value.message);
          }
        })
        .then(() => setLoading(false));
    }
  }, [loading]);

  return {
    agroups,
    loading,
    setLoading,
    error
  };
}

export function useGrantOrDenyAccess(action: 'grant' | 'deny', groupeName: string, roles: string[], call: () => void) {
  const { addAlert } = useApiAlert();
  const { t } = useTranslation();

  const successMessage = 'access-management.access.' + action + '-success';
  const errorMessage = 'access-management.access.' + action + '-error';

  const onGrantOrDenyAccess = () => {
    ConsoleServices.security()
      .grantOrDenyAccess(
        action,
        groupeName,
        roles,
        t(successMessage, { name: groupeName }),
        t(errorMessage, { name: groupeName })
      )
      .then((actionResponse) => {
        addAlert(actionResponse);
      })
      .finally(() => call());
  };
  return {
    onGrantOrDenyAccess
  };
}
