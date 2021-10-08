import * as React from 'react';
import {useEffect, useState} from 'react';
import {
  Button,
  ButtonVariant,
  Card,
  Level,
  LevelItem, Nav, NavItem, NavList,
  PageSection,
  PageSectionVariants, Spinner, Tab, Tabs, TabTitleText,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import {Link} from 'react-router-dom';
import {global_spacer_md, global_spacer_sm} from '@patternfly/react-tokens';
import {useApiAlert} from '@app/utils/useApiAlert';
import {DataContainerBreadcrumb} from '@app/Common/DataContainerBreadcrumb';
import {cellWidth, IRow, Table, TableBody, TableHeader, TableVariant, textCenter,} from '@patternfly/react-table';
import {Status} from '@app/Common/Status';
import {useTranslation} from 'react-i18next';
import {ConsoleServices} from "@services/ConsoleServices";
import {ConsoleACL} from "@services/securityService";
import {useConnectedUser} from "@app/services/userManagementHook";
import {TableErrorState} from "@app/Common/TableErrorState";
import {TableEmptyState} from "@app/Common/TableEmptyState";

interface StateTransferModalState {
  site: string;
  open: boolean;
  action: 'start' | 'cancel' | '';
}

const XSiteCluster = (props) => {
  const { t } = useTranslation();
  const crossSiteReplicationService = ConsoleServices.xsite();
  const { connectedUser } = useConnectedUser();
  const [cmName, setCmName] = useState(props.computedMatch.params.cmName);
  const [activeSite, setActiveSite] = useState<string>();
  const [xsites, setXSites] = useState<XSite[]>();
  const brandname = t('brandname.brandname');
  const { addAlert } = useApiAlert();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const columns = [
    {
      title: 'Status',
      transforms: [textCenter],
      cellTransforms: [textCenter],
    },
    {
      title: 'Action',
      transforms: [textCenter],
      cellTransforms: [textCenter],
    },
  ];

  useEffect(() => {
    if (loading) {
      // Load Sites
      // First check ADMIN
      if(!ConsoleServices.security().hasConsoleACL(ConsoleACL.ADMIN, connectedUser)) {
        setLoading(false);
        setError('Connected user lacks ADMIN permission.');
        return;
      }

      crossSiteReplicationService.sites(cmName)
        .then((maybegXSite) => {
            if(maybeXSite.isRight()) {
              setXSites(maybeXSite.value);
              if (maybeXSite.value.length > 0) {
                setActiveSite(maybeXSite.value[0].name);
              }
            } else {
              setError(maybeXSite.value.message);
            }
        })
        .then(() => setLoading(false))
    }
  }, [loading]);


  const buildXSiteTabs = () => {
    if (loading || error || !xsites || xsites?.length == 0) {
      return '';
    }

    return (
      <Nav
        onSelect={(nav) => setActiveSite(nav.itemId as string)}
        variant={'tertiary'}
        style={{ marginTop: global_spacer_md.value }}
      >
        <NavList>
          {xsites.map((xsite) => (
            <NavItem
              aria-label={'nav-item-' + xsite.name}
              key={'nav-item-' + xsite.name}
              itemId={xsite.name}
              isActive={activeSite === xsite.name}
            >
              {xsite.name}
            </NavItem>
          ))}
        </NavList>
      </Nav>
    );
  }

  const buildXSiteTabContent = () => {
    if (loading || error || !xsites || xsites?.length == 0) {
      return (
        <TableEmptyState loading={loading} error={error} empty={'Backup site list is empty.'}/>
      )
    }


    return (
      <Table
        aria-label={'xsite-cluster'}
        cells={[]}
        rows={[]}
        variant={TableVariant.compact}
      >
        <TableHeader />
        <TableBody />
      </Table>
    )
  }
  return (
    <React.Fragment>
      <PageSection variant={PageSectionVariants.light} style={{ paddingBottom: 0 }}>
        <DataContainerBreadcrumb
          currentPage="Backup management"
        />
        <Level>
          <LevelItem>
            <TextContent
              style={{ marginTop: global_spacer_md.value }}
              key={'title-backups'}
            >
              <Text component={TextVariants.h1} key={'title-value-backups'}>
                Backups management
              </Text>
            </TextContent>
          </LevelItem>
          <LevelItem>
            <Text key={'button-back'}>
              <Link
                to={{
                  pathname: '/',
                }}
              >
                <Button variant={ButtonVariant.secondary}>Back</Button>
              </Link>
            </Text>
          </LevelItem>
        </Level>
        {buildXSiteTabs()}
      </PageSection>
      <PageSection>
        {buildXSiteTabContent()}
      </PageSection>
    </React.Fragment>
  );
};
export { XSiteCluster };
