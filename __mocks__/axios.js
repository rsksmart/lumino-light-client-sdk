const mockAxios = jest.genMockFromModule("axios");

// this is the key to fix the axios.create() undefined error!
mockAxios.create = jest.fn(() => mockAxios);

mockAxios.CancelToken = {
  source: jest.fn(() => {
    return {
      token: "CancelToken",
      cancel: () => jest.fn(),
    };
  }),
};

export default mockAxios;
