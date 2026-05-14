import { Test, TestingModule } from '@nestjs/testing';
import { AthleteSportsController } from './athlete-sports.controller';

describe('AthleteSportsController', () => {
  let controller: AthleteSportsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AthleteSportsController],
    }).compile();

    controller = module.get<AthleteSportsController>(AthleteSportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
