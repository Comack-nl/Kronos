export type Columns = {
	[ key: string ]: string;
};

export type Option = {
	field: string;
	description: string;
	required: boolean;
	alias?: string;
	defaultValue?: any;
};

export type OptionsConfig = {
	[ key: string ]: OptionConfig;
};

export type OptionConfig = {
	[ key: string ]: any;
};

export type Record = {
	[ key: string ]: any;
};
