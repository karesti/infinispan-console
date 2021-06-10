import React, { useEffect, useState } from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppLayout } from '@app/AppLayout/AppLayout';
import { AppRoutes } from '@app/routes';
import '@app/app.css';
import { KeycloakService } from '@services/keycloakService';
import { ConsoleServices } from '@services/ConsoleServices';
import { UserContextProvider } from '@app/providers/UserContextProvider';
import {ContainerDataProvider} from "@app/providers/CacheManagerContextProvider";

const App = () => {
  const [init, setInit] = useState<
    | 'SERVER_ERROR'
    | 'READY'
    | 'NOT_READY'
    | 'PENDING'
    | 'DONE'
    | 'LOGIN'
    | 'DIGEST_LOGIN'
  >('PENDING');
  ConsoleServices.init();

  useEffect(() => {
    ConsoleServices.authentication()
      .config()
      .then((eitherAuth) => {
        if (eitherAuth.isRight()) {
          if (eitherAuth.value.keycloakConfig) {
            // Keycloak
            KeycloakService.init(eitherAuth.value.keycloakConfig)
              .catch((err) => {
                console.error(err);
                setInit('SERVER_ERROR');
              })
              .then((result) => {
                if (ConsoleServices.isWelcomePage()) {
                  setInit('LOGIN');
                } else {
                  // if not welcome page
                  if (!KeycloakService.Instance.authenticated()) {
                    KeycloakService.Instance.login();
                  }
                  localStorage.setItem(
                    'react-token',
                    KeycloakService.keycloakAuth.token
                  );
                  localStorage.setItem(
                    'react-refresh-token',
                    KeycloakService.keycloakAuth.refreshToken
                  );
                  setTimeout(() => {
                    KeycloakService.Instance.getToken().then((token) => {
                      localStorage.setItem('react-token', token);
                    });
                  }, 60000);
                  setInit('DONE');
                }
              });
          } else if (eitherAuth.value.ready) {
            if (eitherAuth.value.digest) {
              console.log('update init to digest login');
              setInit('DIGEST_LOGIN');
            } else {
              ConsoleServices.authentication().noSecurityMode();
              setInit('READY');
            }
          } else {
            setInit('NOT_READY');
          }
        } else {
          setInit('SERVER_ERROR');
        }
      });
  }, []);

  const load = () => {
    return (
      <Router basename="/console">
        <UserContextProvider>
          <ContainerDataProvider>
          <AppLayout init={init}>
            <AppRoutes init={init} />
          </AppLayout>
          </ContainerDataProvider>
        </UserContextProvider>
      </Router>
    );
  };

  return load();
};

export { App };
