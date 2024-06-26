/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SavedObjectsClientContract, ToastsStart } from 'opensearch-dashboards/public';
import { i18n } from '@osd/i18n';
import { IUiSettingsClient } from 'src/core/public';
import { DataSourceFilterGroup, SelectedDataSourceOption } from './data_source_filter_group';
import { getDataSourcesWithFields } from '../utils';

export interface DataSourceMultiSeletableProps {
  savedObjectsClient: SavedObjectsClientContract;
  notifications: ToastsStart;
  onSelectedDataSources: (dataSources: SelectedDataSourceOption[]) => void;
  hideLocalCluster: boolean;
  fullWidth: boolean;
  uiSettings?: IUiSettingsClient;
}

interface DataSourceMultiSeletableState {
  dataSourceOptions: SelectedDataSourceOption[];
  selectedOptions: SelectedDataSourceOption[];
  defaultDataSource: string | null;
}

export class DataSourceMultiSelectable extends React.Component<
  DataSourceMultiSeletableProps,
  DataSourceMultiSeletableState
> {
  private _isMounted: boolean = false;

  constructor(props: DataSourceMultiSeletableProps) {
    super(props);

    this.state = {
      dataSourceOptions: [],
      selectedOptions: [],
      defaultDataSource: null,
    };
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  async componentDidMount() {
    this._isMounted = true;
    try {
      const defaultDataSource = this.props.uiSettings?.get('defaultDataSource', null) ?? null;
      let selectedOptions: SelectedDataSourceOption[] = [];
      const fetchedDataSources = await getDataSourcesWithFields(this.props.savedObjectsClient, [
        'id',
        'title',
        'auth.type',
      ]);

      if (fetchedDataSources?.length) {
        selectedOptions = fetchedDataSources.map((dataSource) => ({
          id: dataSource.id,
          label: dataSource.attributes?.title || '',
          checked: 'on',
          visible: true,
        }));
      }

      if (!this.props.hideLocalCluster) {
        selectedOptions.unshift({
          id: '',
          label: 'Local cluster',
          checked: 'on',
          visible: true,
        });
      }

      if (!this._isMounted) return;

      this.setState({
        ...this.state,
        selectedOptions,
        defaultDataSource,
      });

      this.props.onSelectedDataSources(selectedOptions);
    } catch (error) {
      this.props.notifications.addWarning(
        i18n.translate('dataSource.fetchDataSourceError', {
          defaultMessage: 'Unable to fetch existing data sources',
        })
      );
    }
  }

  onChange(selectedOptions: SelectedDataSourceOption[]) {
    if (!this._isMounted) return;
    this.setState({
      selectedOptions,
    });
    this.props.onSelectedDataSources(selectedOptions.filter((option) => option.checked === 'on'));
  }

  render() {
    return (
      <DataSourceFilterGroup
        selectedOptions={this.state.selectedOptions}
        setSelectedOptions={this.onChange.bind(this)}
        defaultDataSource={this.state.defaultDataSource}
      />
    );
  }
}
