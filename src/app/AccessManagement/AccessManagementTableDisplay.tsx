import React, { useEffect, useState } from 'react';
import {
  Bullseye,
  Chip,
  ChipGroup,
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateVariant,
  Pagination,
  SearchInput,
  Spinner,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  ToolbarItemVariant
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { DatabaseIcon, SearchIcon } from '@patternfly/react-icons';
import { useFetchAvailableGroups } from '@app/services/accessManagementHook';

const AccessManagementTableDisplay = () => {
  const { t } = useTranslation();
  const brandname = t('brandname.brandname');
  const { agroups, setLoading, loading, error } = useFetchAvailableGroups();
  const [searchValue, setSearchValue] = useState<string>('');
  const [groupsPagination, setGroupsPagination] = useState({
    page: 1,
    perPage: 10
  });

  const [filteredGroups, setFilteredGroups] = useState<AccessGroup[]>([]);
  const [groupsRows, setGroupsRows] = useState<AccessGroup[]>([]);

  useEffect(() => {
    if (searchValue.trim() !== '') {
      setFilteredGroups(agroups.filter((role) => role.name.toLowerCase().includes(searchValue.toLowerCase())));
    } else {
      setFilteredGroups(agroups);
    }
    setGroupsPagination({
      ...groupsPagination,
      page: 1
    });
  }, [groupsRows, searchValue]);

  useEffect(() => {
    const initSlice = (groupsPagination.page - 1) * groupsPagination.perPage;
    setGroupsRows(filteredGroups.slice(initSlice, initSlice + groupsPagination.perPage));
  }, [filteredGroups, groupsPagination]);

  const columnNames = {
    name: t('access-management.access.name'),
    roles: t('access-management.access.roles')
  };

  const onSetPage = (_event, pageNumber) => {
    setGroupsPagination({
      ...groupsPagination,
      page: pageNumber
    });
  };

  const onPerPageSelect = (_event, perPage) => {
    setGroupsPagination({
      page: 1,
      perPage: perPage
    });
  };

  const onSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const pagination = (
    <Pagination
      itemCount={agroups.length}
      perPage={groupsPagination.perPage}
      page={groupsPagination.page}
      onSetPage={onSetPage}
      widgetId="pagination-groups"
      onPerPageSelect={onPerPageSelect}
      isCompact
    />
  );

  const displayRows = () => {
    return (
      <React.Fragment>
        {groupsRows.map((row) => (
          <Tr key={row.name}>
            <Td dataLabel={columnNames.name} width={15}>
              {row.name}
            </Td>
            <Td dataLabel={columnNames.roles} width={30}>
              {
                <ChipGroup>
                  {row.roles.map((currentChip) => (
                    <Chip key={currentChip} isReadOnly={true}>
                      {currentChip}
                    </Chip>
                  ))}
                </ChipGroup>
              }
            </Td>
          </Tr>
        ))}
      </React.Fragment>
    );
  };

  const displayEmptySearch = () => {
    return (
      <Tr>
        <Td colSpan={2}>
          <Bullseye>
            <EmptyState variant={EmptyStateVariant.sm}>
              <EmptyStateIcon icon={SearchIcon} />
              <Title headingLevel="h2" size="lg">
                {t('access-management.access.no-access-found')}
              </Title>
              <EmptyStateBody>
                {groupsRows.length == 0
                  ? t('access-management.access.no-access-body')
                  : t('access-management.access.no-filtered-roles-body')}
              </EmptyStateBody>
            </EmptyState>
          </Bullseye>
        </Td>
      </Tr>
    );
  };

  if (loading) {
    return (
      <Bullseye>
        <EmptyState variant={EmptyStateVariant.sm}>
          <EmptyStateHeader
            titleText={<>{t('access-management.access.loading-access')}</>}
            icon={<EmptyStateIcon icon={Spinner} />}
            headingLevel="h4"
          />
        </EmptyState>
      </Bullseye>
    );
  }

  if (error) {
    return (
      <Bullseye>
        <EmptyState variant={EmptyStateVariant.sm}>
          <EmptyStateHeader
            titleText={<>{t('access-management.access.loading-access-error')}</>}
            icon={<EmptyStateIcon icon={Spinner} />}
            headingLevel="h4"
          />
        </EmptyState>
      </Bullseye>
    );
  }

  const displayContent = () => {
    if (agroups.length === 0) {
      return (
        <EmptyState variant={EmptyStateVariant.lg}>
          <EmptyStateHeader
            titleText={t('access-management.access.no-access-status')}
            icon={<EmptyStateIcon icon={DatabaseIcon} />}
            headingLevel="h4"
          />
          <EmptyStateBody>{t('access-management.access.no-access-body', { brandname: brandname })}</EmptyStateBody>
          {/*<EmptyStateFooter>{createGrantAccessButtonHelper(true)}</EmptyStateFooter>*/}
        </EmptyState>
      );
    }
    return (
      <React.Fragment>
        <Toolbar id="access-table-toolbar" className={'access-table-display'}>
          <ToolbarContent>
            <ToolbarGroup variant="filter-group">
              <ToolbarItem variant={'search-filter'}>
                <SearchInput
                  placeholder={t('access-management.access.search-placeholder')}
                  value={searchValue}
                  onChange={(_event, value) => onSearchChange(value)}
                  onSearch={(_event, value) => onSearchChange(value)}
                  onClear={() => setSearchValue('')}
                />
              </ToolbarItem>
              {/*<ToolbarItem>{createGrantAccessButtonHelper(false)}</ToolbarItem>*/}
            </ToolbarGroup>
            <ToolbarItem variant={ToolbarItemVariant.pagination}>{pagination}</ToolbarItem>
          </ToolbarContent>
        </Toolbar>
        <Table className={'access-table'} aria-label={'access-table-label'} variant={'compact'}>
          <Thead noWrap>
            <Tr>
              <Th
                info={{
                  popover: <div>{t('access-management.access.access-name-tooltip')}</div>,
                  ariaLabel: 'Access mapping name more information',
                  popoverProps: {
                    headerContent: columnNames.name,
                    footerContent: (
                      <a target="_blank" rel="noreferrer" href={t('brandname.default-access-docs-link')}>
                        {t('access-management.access.access-hint-link', { brandname: brandname })}
                      </a>
                    )
                  }
                }}
              >
                {columnNames.name}
              </Th>
              <Th>{columnNames.roles}</Th>
            </Tr>
          </Thead>
          <Tbody>{groupsRows.length == 0 ? displayEmptySearch() : displayRows()}</Tbody>
        </Table>
        <Toolbar id="role-table-toolbar" className={'role-table-display'}>
          <ToolbarItem variant={ToolbarItemVariant.pagination}>{pagination}</ToolbarItem>
        </Toolbar>
      </React.Fragment>
    );
  };

  return (
    <React.Fragment>
      {displayContent()}
    </React.Fragment>
  );
};

export { AccessManagementTableDisplay };
