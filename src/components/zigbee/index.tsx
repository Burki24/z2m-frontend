import React, { Component, Fragment, ReactNode } from "react";

import { Device, DeviceState } from "../../types";
import { Notyf } from "notyf";
import { connect } from "unistore/react";
import { GlobalState } from "../../store";
import actions from "../../actions/actions";
import style from "./style.css";
import Spinner from "../spinner";
import { genDeviceDetailsLink, lastSeen, toHex } from "../../utils";
import { WithTranslation, withTranslation } from "react-i18next";
import DeviceImage from "../device-image";
import { ModelLink, VendorLink } from "../vendor-links/verndor-links";
import { Link } from "react-router-dom";
import { DisplayValue } from "../display-value/DisplayValue";
import { LastSeen } from "../LastSeen";
import PowerSource from "../power-source";
import DeviceControlGroup from "../device-control/DeviceControlGroup";
import { Table } from "../grid/ReactTableCom";
import { CellProps, Column } from "react-table";
export interface ZigbeeTableData {
    id: string;
    device: Device;
    state: DeviceState;
}


type PropsFromStore = Pick<GlobalState, 'devices' | 'deviceStates' | 'bridgeInfo'>;
type ZigbeeTableProps = PropsFromStore & WithTranslation<"zigbee">;

export class ZigbeeTable extends Component<ZigbeeTableProps> {
    render(): JSX.Element {
        const { devices } = this.props;
        if (Object.keys(devices).length) {
            return this.renderDevicesTable();
        }
        return (<div className="h-100 d-flex justify-content-center align-items-center">
            <Spinner />
        </div>);
    }
    getDevicesToRender(): ZigbeeTableData[] {
        const { devices, deviceStates } = this.props;
        return Object.values(devices)
            .filter(device => device.type !== "Coordinator")
            .map((device) => {
                const state = deviceStates[device.friendly_name] ?? {} as DeviceState;
                return {
                    id: device.friendly_name,
                    device,
                    state
                } as ZigbeeTableData;
            });
    }

    renderDevicesTable(): JSX.Element {
        const { bridgeInfo, t } = this.props;
        const devices = this.getDevicesToRender();

        const columns: Column<ZigbeeTableData>[] = [
            {
                Header: '#',
                id: '-rownumber',
                Cell: ({ row }: CellProps<ZigbeeTableData>) => <div className="font-weight-bold">{row.index + 1}</div>,
                disableSortBy: true,

            },
            {
                Header: t('pic') as string,
                Cell: ({ value: { device, state } }) => <DeviceImage className={style["device-image"]} device={device} deviceStatus={state} />,
                accessor: rowData => rowData,
                disableSortBy: true,

            },
            {
                id: 'friendly_name',
                Header: t('friendly_name') as string,
                accessor: ({ device }) => device.friendly_name,
                Cell: ({ row: { original: { device } } }) => <Link to={genDeviceDetailsLink(device.ieee_address)}>{device.friendly_name}</Link>

            },
            {
                Header: t('ieee_address') as string,
                accessor: ({ device }) => [device.ieee_address, toHex(device.network_address, 4)].join(' '),
                Cell: ({ row: { original: { device } } }) => <>{device.ieee_address} ({toHex(device.network_address, 4)})</>,
            },
            {
                Header: t('manufacturer') as string,
                accessor: ({ device }) => [device.manufacturer, device.definition?.vendor].join(' '),
                Cell: ({ row: { original: { device } } }) => <VendorLink device={device} />
            },
            {
                Header: t('model') as string,
                accessor: ({ device }) => [device.model_id, device.definition?.model].join(' '),
                Cell: ({ row: { original: { device } } }) => <ModelLink device={device} />
            },
            {
                Header: t('lqi') as string,
                accessor: ({ state }) => state.linkquality,
                Cell: ({ row: { original: { state } } }) => <DisplayValue value={state.linkquality} name="linkquality" />,
            },
            ...(bridgeInfo.config.advanced.last_seen !== "disable" ? [{
                Header: t('last_seen') as string,
                accessor: ({ state }) => lastSeen(state, bridgeInfo.config.advanced.last_seen)?.getTime(),
                Cell: ({ row: { original: { state } } }) => <LastSeen state={state} lastSeenType={bridgeInfo.config.advanced.last_seen} />,

            }] : []),


            {
                Header: t('power') as string,
                accessor: ({ device }) => device.power_source,
                Cell: ({ row: { original: { state, device } } }) => <PowerSource source={device.power_source} battery={state.battery as number} batteryLow={state.battery_low as boolean} />,
            },
            {
                Header: '',
                id: '-controls',
                Cell: ({ row: { original: { state, device } } }) => <DeviceControlGroup device={device} state={state} />,
                disableSortBy: true,
            }
        ];

        return (<div className="card">
            <div className="table-responsive mt-1">
                <Table
                    id="zigbee"
                    columns={columns}
                    data={devices}
                />
            </div>
        </div>);
    }
}

const mappedProps = ["devices", "deviceStates", "bridgeInfo"];
const ConnectedZigbeePage = withTranslation(["zigbee", "common"])(connect<unknown, unknown, PropsFromStore, unknown>(mappedProps, actions)(ZigbeeTable));
export default ConnectedZigbeePage;
