import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    strategy = new JwtStrategy();
  });

  it('should transform jwt payload into user object', async () => {
    const payload = { sub: 'user-1', email: 'wahyu@gmail.com', role: 'member' };

    const result = await strategy.validate(payload);

    expect(result).toEqual({
      id: 'user-1',
      email: 'wahyu@gmail.com',
      role: 'member',
    });
  });
});