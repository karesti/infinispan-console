import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Card,
  CardBody,
  Nav,
  NavItem,
  NavList,
  PageSection,
  PageSectionVariants,
  Text,
  TextContent,
  TextVariants
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { RoleTableDisplay } from '@app/AccessManagement/RoleTableDisplay';
import { AccessManagementTableDisplay } from '@app/AccessManagement/AccessManagementTableDisplay';

const AccessManager = () => {
  const { t } = useTranslation();
  const brandname = t('brandname.brandname');
  const [activeTabKey, setActiveTabKey] = useState('0');
  const [showRoles, setShowRoles] = useState(true);
  const [showAccessControl, setShowAccessControl] = useState(false);

  interface AccessTab {
    key: string;
    name: string;
  }

  useEffect(() => {
    setShowRoles(activeTabKey === '0');
    setShowAccessControl(activeTabKey === '1');
  }, [activeTabKey]);

  const handleTabClick = (ev, nav) => {
    setActiveTabKey(nav.itemId);
  };

  const buildTabs = () => {
    const tabs: AccessTab[] = [
      { name: t('access-management.tab-roles'), key: '0' },
      { name: t('access-management.tab-access-control'), key: '1' }
    ];

    return (
      <Nav data-cy="navigationTabs" onSelect={handleTabClick} variant={'tertiary'}>
        <NavList>
          {tabs.map((tab) => (
            <NavItem
              aria-label={'nav-item-' + tab.name}
              key={'nav-item-' + tab.key}
              itemId={tab.key}
              isActive={activeTabKey === tab.key}
            >
              {tab.name}
            </NavItem>
          ))}
        </NavList>
      </Nav>
    );
  };

  const buildSelectedContent = (
    <Card>
      <CardBody>
        {showRoles && <RoleTableDisplay />}
        {showAccessControl && <AccessManagementTableDisplay/>}
      </CardBody>
    </Card>
  );

  return (
    <>
      <PageSection variant={PageSectionVariants.light} style={{ paddingBottom: 0 }}>
        <TextContent style={{ marginBottom: '1rem' }}>
          <Text component={TextVariants.h1}>{t('access-management.title')}</Text>
          <Text component={TextVariants.p}>{t('access-management.description', { brandname: brandname })}</Text>
        </TextContent>
        {buildTabs()}
      </PageSection>
      <PageSection variant={PageSectionVariants.default}>{buildSelectedContent}</PageSection>
    </>
  );
};

export { AccessManager };
